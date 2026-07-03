import fs from "fs";
import path from "path";
import { env } from "../config/env";

// Storage abstraction: local disk today, drop-in Azure Blob Storage later
// by implementing the same interface and switching STORAGE_DRIVER=azure.
export interface StorageDriver {
  save(storedName: string, sourcePath: string): Promise<string>;
  getAbsolutePath(storedName: string): string;
  remove(storedName: string): Promise<void>;
}

class LocalStorageDriver implements StorageDriver {
  async save(storedName: string, sourcePath: string): Promise<string> {
    // multer disk storage already wrote the file to uploadDir/storedName
    return path.join(env.storage.uploadDir, storedName);
  }

  getAbsolutePath(storedName: string): string {
    return path.join(env.storage.uploadDir, storedName);
  }

  async remove(storedName: string): Promise<void> {
    const filePath = this.getAbsolutePath(storedName);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }
}

// Placeholder — implement with @azure/storage-blob when AZURE_STORAGE_CONNECTION_STRING is set.
class AzureBlobStorageDriver implements StorageDriver {
  async save(): Promise<string> {
    throw new Error("Azure Blob Storage driver not yet configured. Set STORAGE_DRIVER=local for now.");
  }
  getAbsolutePath(): string {
    throw new Error("Azure Blob Storage driver not yet configured.");
  }
  async remove(): Promise<void> {
    throw new Error("Azure Blob Storage driver not yet configured.");
  }
}

export const storageDriver: StorageDriver =
  env.storage.driver === "azure" ? new AzureBlobStorageDriver() : new LocalStorageDriver();
