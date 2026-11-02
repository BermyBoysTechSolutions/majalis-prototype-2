#!/usr/bin/env python3
"""Explicit, budget-limited video jobs. Credentials stay in the owner's env file.

POSTs never retry. An uncertain submission keeps its full budget reservation.
Keep state outside the public repository: it can contain expiring download URLs.
"""
import argparse
import base64
from datetime import datetime, timezone
from decimal import Decimal, ROUND_UP
import json
import os
from pathlib import Path
import re
import urllib.error
import urllib.parse
import urllib.request

BASE = "https://openrouter.ai/api/v1"
MODEL = "bytedance/seedance-1-5-pro"
SPECS = {
    MODEL: (1280, 720, "720p", "0.0000012", "0.16"),
    "bytedance/seedance-2.0-fast": (864, 496, "480p", "0.0000042", "0.27"),
}
CAP = Decimal("1.95")
FLOOR = Decimal("0.16858")
SECONDS = 6


class ApiFailure(RuntimeError):
    def __init__(self, status, message, limit_source=None, retry_after=None):
        super().__init__(f"HTTP {status}: {message}")
        self.status = status
        self.limit_source = limit_source
        self.retry_after = retry_after


class SafeRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        destination = urllib.parse.urlparse(newurl)
        if destination.scheme != "https":
            raise RuntimeError("Refusing insecure download redirect")
        redirected = super().redirect_request(req, fp, code, msg, headers, newurl)
        if redirected and (destination.hostname != "openrouter.ai" or destination.port not in (None, 443)):
            redirected.remove_header("Authorization")
        return redirected


def private_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as f:
        json.dump(data, f, indent=2)
    tmp.replace(path)


def key_from_owner_file():
    source = Path(os.environ["MAJALIS_OPENROUTER_ENV_FILE"])
    for line in source.read_text().splitlines():
        if re.match(r"RAG_OPENAI_API_KEY\s*=", line):
            value = line.split("=", 1)[1].strip().strip("\"'")
            if value.startswith("sk-or-"):
                return value
    raise RuntimeError("No OpenRouter credential in the configured owner file")


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("action", choices=["balance", "submit", "poll", "download"])
    p.add_argument("--state", type=Path, required=True)
    p.add_argument("--scene", type=int)
    p.add_argument("--image", type=Path)
    p.add_argument("--last-image", type=Path)
    p.add_argument("--job")
    p.add_argument("--output", type=Path)
    p.add_argument("--replacement", action="store_true")
    p.add_argument("--model", choices=list(SPECS), default=MODEL)
    p.add_argument("--seconds", type=int, choices=[4, 6], default=SECONDS)
    args = p.parse_args()
    width, height, resolution, rate, reservation = SPECS[args.model]
    estimate = Decimal(width * height * (args.seconds * 24 + 1)) / 1024 * Decimal(rate)
    reservation = estimate.quantize(Decimal("0.01"), rounding=ROUND_UP) + Decimal("0.01")
    args.state.mkdir(parents=True, exist_ok=True, mode=0o700)
    if Path(__file__).resolve().parents[1] in args.state.resolve().parents:
        raise RuntimeError("Keep private job state outside the public repository")
    key = key_from_owner_file()
    opener = urllib.request.build_opener(SafeRedirect())

    def api(route, payload=None):
        if not route.startswith("/") or route.startswith("//"):
            raise RuntimeError("Invalid API route")
        body = json.dumps(payload).encode() if payload is not None else None
        req = urllib.request.Request(BASE + route, data=body, headers={
            "Authorization": "Bearer " + key,
            "Content-Type": "application/json", "X-Title": "MAJALIS prototype media",
        })
        try:
            with opener.open(req, timeout=90) as response:
                return json.load(response)
        except urllib.error.HTTPError as e:
            # Only the documented error message, never the request/body/credential.
            try:
                data = json.load(e)
                error = data.get("error", {})
                message = error.get("message", "API request failed")
                limit_source = error.get("metadata", {}).get("limit_source")
            except Exception:
                message = "API request failed"
                limit_source = None
            message = re.sub(r"sk-or-[A-Za-z0-9_-]+", "[REDACTED]", str(message))
            status, retry_after = e.code, e.headers.get("Retry-After")
            e.close()
            raise ApiFailure(status, message[:600], limit_source, retry_after) from None

    def balance():
        data = api("/credits")["data"]
        return Decimal(str(data["total_credits"])) - Decimal(str(data["total_usage"]))

    ledger_path = args.state / "ledger.json"
    ledger = json.loads(ledger_path.read_text()) if ledger_path.exists() else {
        "cap_usd": str(CAP), "model": MODEL, "jobs": [],
    }
    if args.action == "balance":
        print(json.dumps({"remaining_usd": str(balance()), "cap_usd": str(CAP),
                          "estimate_per_clip_usd": str(estimate),
                          "six_clips_usd": str(estimate * 6)}))
        return

    if args.action == "submit":
        if ledger.get("closed"):
            raise RuntimeError("This generation run is closed; no further paid requests")
        if args.scene not in range(1, 7) or not args.image or not args.image.is_file():
            raise RuntimeError("Choose scene 1–6 and an existing first frame")
        if any(j["scene"] == args.scene for j in ledger["jobs"]) and not args.replacement:
            raise RuntimeError("Scene already submitted; explicit --replacement required")
        if len(ledger["jobs"]) >= 12:
            raise RuntimeError("Maximum 12 submissions reached")
        catalog = api("/videos/models")["data"]
        model = next(m for m in catalog if m["id"] == args.model)
        if (model["pricing_skus"].get("video_tokens_without_audio") != rate
                or args.seconds not in model["supported_durations"]
                or resolution not in model["supported_resolutions"]
                or "first_frame" not in model["supported_frame_images"]):
            raise RuntimeError("Live model price/capabilities changed; reassess before spending")
        reserved = sum((Decimal(j["charged_or_reserved_usd"]) for j in ledger["jobs"]), Decimal(0))
        remaining = balance()
        if reserved + reservation > CAP or remaining - reservation < FLOOR:
            raise RuntimeError("Budget or credit reserve prevents another submission")
        prompts = json.loads((Path(__file__).parent.parent / "docs/video-scenes.json").read_text())
        prompt = prompts["scenes"][str(args.scene)] + "\n\n" + prompts["shared"]

        def frame(path, kind):
            mime = "image/png" if path.suffix.lower() == ".png" else "image/jpeg"
            return {"type": "image_url", "image_url": {"url":
                f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode()},
                "frame_type": kind}

        frames = [frame(args.image, "first_frame")]
        if args.last_image:
            if "last_frame" not in model["supported_frame_images"]:
                raise RuntimeError("Last-frame input unsupported")
            frames.append(frame(args.last_image, "last_frame"))
        payload = {"model": args.model, "prompt": prompt, "duration": args.seconds,
                   "resolution": resolution, "aspect_ratio": "16:9", "generate_audio": False,
                   "frame_images": frames, "seed": 73119 + args.scene}
        attempt = {"scene": args.scene, "model": args.model, "resolution": resolution,
                   "requested_seconds": args.seconds,
                   "started_at": datetime.now(timezone.utc).isoformat(),
                   "charged_or_reserved_usd": str(reservation), "credit_before_usd": str(remaining),
                   "status": "submission_uncertain", "prompt": prompt,
                   "first_image": str(args.image),
                   "last_image": str(args.last_image) if args.last_image else None}
        ledger["jobs"].append(attempt)
        private_json(ledger_path, ledger)  # Reserve before making any chargeable request.
        try:
            data = api("/videos", payload)
        except ApiFailure as error:
            if error.status == 402 and error.limit_source == "openrouter_in_flight_budget":
                attempt.update({"status": "rejected_http_402_in_flight", "charged_or_reserved_usd": "0",
                                "limit_source": error.limit_source, "retry_after": error.retry_after})
                private_json(ledger_path, ledger)
            # Never retry here, even a documented pre-generation rejection.
            raise
        if not data.get("id"):
            raise RuntimeError("No job ID returned; reservation retained; do not retry blindly")
        attempt.update({"id": data["id"], "status": data.get("status", "pending")})
        private_json(args.state / (data["id"] + ".json"), data)
        private_json(ledger_path, ledger)
        print(json.dumps({"scene": args.scene, "id": data["id"], "status": attempt["status"],
                          "estimated_usd": str(estimate), "reserved_total_usd": str(reserved + reservation)}))
        return

    job = next((j for j in ledger["jobs"] if j.get("id") == args.job), None)
    if not job or not re.fullmatch(r"[A-Za-z0-9_-]+", args.job):
        raise RuntimeError("Unknown job")
    data = api("/videos/" + args.job)
    private_json(args.state / (args.job + ".json"), data)
    job["status"] = data.get("status")
    cost = data.get("usage", {}).get("cost")
    if cost is not None:
        job["charged_or_reserved_usd"] = str(cost)
        job["reported_cost_usd"] = str(cost)
    private_json(ledger_path, ledger)
    print(json.dumps({"scene": job["scene"], "id": args.job, "status": job["status"],
                      "usage": data.get("usage"), "error": data.get("error")}))
    if args.action == "download":
        if job["status"] != "completed" or not args.output:
            raise RuntimeError("Download requires completed job and output path")
        args.output.parent.mkdir(parents=True, exist_ok=True)
        req = urllib.request.Request(BASE + "/videos/" + args.job + "/content?index=0",
                                     headers={"Authorization": "Bearer " + key})
        tmp = args.output.with_suffix(".partial")
        with opener.open(req, timeout=90) as response, tmp.open("wb") as out:
            content_type = response.headers.get("Content-Type", "")
            if not (content_type.startswith("video/") or content_type == "application/octet-stream"):
                raise RuntimeError("Unexpected video download content type")
            count = 0
            while chunk := response.read(1024 * 1024):
                count += len(chunk)
                if count > 150 * 1024 * 1024:
                    raise RuntimeError("Unexpectedly large download")
                out.write(chunk)
        tmp.replace(args.output)
        job["local_video"] = str(args.output)
        private_json(ledger_path, ledger)
        print(json.dumps({"downloaded": str(args.output), "bytes": count}))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Stopped: {type(exc).__name__}: {exc}")
        raise SystemExit(1)
