import { Client, Storage, ID } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import fs from "fs";
import path from "path";
import { config } from "../config";
import { Logger } from "../logger";

export class AppwriteStorageService {
  private storage: Storage | null = null;
  private endpoint: string;
  private projectId: string;
  private bucketId: string;

  constructor() {
    const { endpoint, projectId, apiKey, bucketId } = config.appwrite;
    this.endpoint = endpoint || "https://cloud.appwrite.io/v1";
    this.projectId = projectId || "";
    this.bucketId = bucketId || "place-images";

    if (this.projectId && apiKey) {
      try {
        const client = new Client()
          .setEndpoint(this.endpoint)
          .setProject(this.projectId)
          .setKey(apiKey);

        this.storage = new Storage(client);
        Logger.info("Appwrite Storage Service initialized successfully.");
      } catch (err) {
        Logger.error("Failed to initialize Appwrite Storage client:", err);
      }
    }
  }

  public isConfigured(): boolean {
    return this.storage !== null;
  }

  /**
   * Uploads an image file to Appwrite Storage bucket and returns the generated public view URL.
   * If Appwrite credentials are not configured, falls back to saving locally in public/uploads.
   */
  public async uploadImage(
    buffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<{ url: string; fileId: string }> {
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

    if (this.storage && this.projectId) {
      try {
        const fileId = ID.unique();
        const inputFile = InputFile.fromBuffer(buffer, cleanFileName);

        const uploadedFile = await this.storage.createFile({
          bucketId: this.bucketId,
          fileId,
          file: inputFile,
        });

        // Construct Appwrite Cloud Storage file view URL
        const viewUrl = `${this.endpoint}/storage/buckets/${this.bucketId}/files/${uploadedFile.$id}/view?project=${this.projectId}`;

        Logger.info(`Successfully uploaded image to Appwrite Bucket (${this.bucketId}), File ID: ${uploadedFile.$id}`);
        return {
          url: viewUrl,
          fileId: uploadedFile.$id,
        };
      } catch (error: any) {
        Logger.error("Appwrite Storage upload failed:", error?.message || error);
        throw new Error(`Appwrite Cloud Storage upload error: ${error?.message || "Failed to upload file"}`);
      }
    }

    // Fallback: Local filesystem upload in public/uploads for development mode
    Logger.info("Appwrite Cloud not configured. Uploading file locally to public/uploads.");
    const uploadsDir = path.join(process.cwd(), "public", "uploads");

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const uniqueName = `${Date.now()}_${cleanFileName}`;
    const filePath = path.join(uploadsDir, uniqueName);

    await fs.promises.writeFile(filePath, buffer);
    const localUrl = `/uploads/${uniqueName}`;

    return {
      url: localUrl,
      fileId: uniqueName,
    };
  }
}

export default AppwriteStorageService;
