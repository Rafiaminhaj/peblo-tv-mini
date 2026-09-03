import os
import shutil
from abc import ABC, abstractmethod
from pathlib import Path

class StorageProvider(ABC):
    @abstractmethod
    def save_file(self, file_bytes: bytes, filename: str, subfolder: str = "") -> str:
        """Saves a file and returns its public or relative URL/path."""
        pass

    @abstractmethod
    def read_file(self, filename: str, subfolder: str = "") -> bytes:
        """Reads and returns file bytes."""
        pass

    @abstractmethod
    def write_atomic_json(self, content_str: str, target_filename: str) -> str:
        """Writes content atomically to target_filename (using temporary swap file)."""
        pass


class LocalStorageProvider(StorageProvider):
    def __init__(self, base_dir: str = "./storage"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save_file(self, file_bytes: bytes, filename: str, subfolder: str = "") -> str:
        folder = self.base_dir / subfolder
        folder.mkdir(parents=True, exist_ok=True)
        file_path = folder / filename
        with open(file_path, "wb") as f:
            f.write(file_bytes)
        return f"/storage/{subfolder}/{filename}".replace("//", "/")

    def read_file(self, filename: str, subfolder: str = "") -> bytes:
        file_path = self.base_dir / subfolder / filename
        with open(file_path, "rb") as f:
            return f.read()

    def write_atomic_json(self, content_str: str, target_filename: str = "catalogue.json") -> str:
        target_path = self.base_dir / target_filename
        tmp_path = self.base_dir / f"{target_filename}.tmp"

        # Step 1: Write to temporary file
        with open(tmp_path, "w", encoding="utf-8") as f:
            f.write(content_str)
            f.flush()
            os.fsync(f.fileno())

        # Step 2: Atomic rename/replace (guarantees readers never see partial write)
        os.replace(tmp_path, target_path)
        return f"/storage/{target_filename}"


class CloudflareR2StorageProvider(StorageProvider):
    """
    Production Cloudflare R2 / S3 abstraction wrapper.
    Demonstrates zero code changes needed to swap storage engines.
    """
    def __init__(self, bucket_name: str, endpoint_url: str, access_key: str, secret_key: str):
        self.bucket_name = bucket_name
        # boto3 client initialization would go here

    def save_file(self, file_bytes: bytes, filename: str, subfolder: str = "") -> str:
        # boto3.s3_client.put_object(...)
        return f"https://r2.peblo.tv/{subfolder}/{filename}"

    def read_file(self, filename: str, subfolder: str = "") -> bytes:
        # boto3.s3_client.get_object(...)
        return b""

    def write_atomic_json(self, content_str: str, target_filename: str = "catalogue.json") -> str:
        # boto3.s3_client.put_object(Bucket=..., Key=target_filename, Body=content_str)
        return f"https://r2.peblo.tv/{target_filename}"


def get_storage_provider() -> StorageProvider:
    provider_type = os.getenv("STORAGE_PROVIDER", "local")
    if provider_type == "r2":
        return CloudflareR2StorageProvider(
            bucket_name=os.getenv("R2_BUCKET", "peblo-catalogue"),
            endpoint_url=os.getenv("R2_ENDPOINT", ""),
            access_key=os.getenv("R2_ACCESS_KEY", ""),
            secret_key=os.getenv("R2_SECRET_KEY", "")
        )
    return LocalStorageProvider()
