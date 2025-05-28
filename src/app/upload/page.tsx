import { AuthGuard } from "@/components/auth/auth-guard";
import { ImageUploader } from "@/components/upload/image-uploader";

export default function UploadPage() {
  return (
    <AuthGuard requireAuth={true}>
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Upload Images</h1>
          <p className="text-muted-foreground">
            Add new images to your gallery. Drag and drop or click to select files.
          </p>
        </div>
        
        <ImageUploader />
      </div>
    </AuthGuard>
  );
}
