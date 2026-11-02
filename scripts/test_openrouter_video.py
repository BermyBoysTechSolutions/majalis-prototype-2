"""Offline checks for money and credential boundaries. Never contacts an API."""
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import urllib.request
import openrouter_video as video


class BudgetBoundaries(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.state = self.root / "state"
        self.image = self.root / "fake.png"
        self.image.write_bytes(b"offline image fixture")
        self.args = ["openrouter_video.py", "submit", "--state", str(self.state),
                     "--scene", "1", "--image", str(self.image)]
        self.posts = []
        self.available = 100
        self.in_flight_rejection = False

    def tearDown(self):
        self.tmp.cleanup()

    def open(self, req, timeout=None):
        if req.get_method() == "POST":
            self.posts.append(req)
            if self.in_flight_rejection:
                body = io.BytesIO(json.dumps({"error": {"message": "In-flight budget full",
                    "metadata": {"limit_source": "openrouter_in_flight_budget"}}}).encode())
                raise video.urllib.error.HTTPError(req.full_url, 402, "Payment Required", {"Retry-After": "30"}, body)
            raise TimeoutError("simulated uncertain submission")
        if req.full_url.endswith("/credits"):
            data = {"data": {"total_credits": self.available, "total_usage": 0}}
        elif req.full_url.endswith("/videos/models"):
            data = {"data": [{"id": video.MODEL,
                "pricing_skus": {"video_tokens_without_audio": "0.0000012"},
                "supported_durations": [4, 6], "supported_resolutions": ["720p"],
                "supported_frame_images": ["first_frame", "last_frame"]}]}
        else:
            raise AssertionError("Unexpected offline route")
        return io.BytesIO(json.dumps(data).encode())

    def run_submit(self):
        with patch("sys.argv", self.args), patch.object(video, "key_from_owner_file", return_value="inert-test-value"), \
             patch.object(video.urllib.request, "build_opener") as opener:
            opener.return_value.open.side_effect = self.open
            video.main()

    def test_uncertain_post_keeps_reservation_and_is_not_retried(self):
        with self.assertRaises(TimeoutError):
            self.run_submit()
        ledger = json.loads((self.state / "ledger.json").read_text())
        self.assertEqual(ledger["jobs"][0]["status"], "submission_uncertain")
        self.assertGreater(float(ledger["jobs"][0]["charged_or_reserved_usd"]), .1566)
        with self.assertRaisesRegex(RuntimeError, "Scene already submitted"):
            self.run_submit()
        self.assertEqual(len(self.posts), 1)

    def test_cap_blocks_paid_request(self):
        self.state.mkdir()
        (self.state / "ledger.json").write_text(json.dumps({"jobs": [
            {"scene": 2, "charged_or_reserved_usd": "1.90"}]}))
        with self.assertRaisesRegex(RuntimeError, "Budget"):
            self.run_submit()
        self.assertEqual(self.posts, [])

    def test_documented_rejection_releases_reservation_without_retry(self):
        self.in_flight_rejection = True
        with self.assertRaises(video.ApiFailure):
            self.run_submit()
        ledger = json.loads((self.state / "ledger.json").read_text())
        self.assertEqual(ledger["jobs"][0]["status"], "rejected_http_402_in_flight")
        self.assertEqual(ledger["jobs"][0]["charged_or_reserved_usd"], "0")
        self.assertEqual(len(self.posts), 1)

    def test_credit_floor_blocks_paid_request(self):
        self.available = .20
        with self.assertRaisesRegex(RuntimeError, "credit reserve"):
            self.run_submit()
        self.assertEqual(self.posts, [])

    def test_completed_run_blocks_paid_request(self):
        self.state.mkdir()
        (self.state / "ledger.json").write_text(json.dumps({"closed": True, "jobs": []}))
        with self.assertRaisesRegex(RuntimeError, "run is closed"):
            self.run_submit()
        self.assertEqual(self.posts, [])

    def test_external_redirect_removes_credential(self):
        req = urllib.request.Request(video.BASE + "/videos/test/content",
                                     headers={"Authorization": "Bearer inert-test-value"})
        redirected = video.SafeRedirect().redirect_request(req, None, 302, "Found", {}, "https://cdn.example/video.mp4")
        self.assertIsNone(redirected.get_header("Authorization"))
        with self.assertRaisesRegex(RuntimeError, "insecure"):
            video.SafeRedirect().redirect_request(req, None, 302, "Found", {}, "http://openrouter.ai/video.mp4")


if __name__ == "__main__":
    unittest.main()
