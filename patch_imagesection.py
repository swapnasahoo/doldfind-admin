import re

with open('src/components/ImageSection.tsx', 'r') as f:
    content = f.read()

# Add setValue and getValues to ImageSectionProps
content = content.replace(
    'interface ImageSectionProps {\n  control: Control<PlaceFormValues>;\n  errors: FieldErrors<PlaceFormValues>;\n}',
    'import { UseFormSetValue, UseFormGetValues } from "react-hook-form";\ninterface ImageSectionProps {\n  control: Control<PlaceFormValues>;\n  errors: FieldErrors<PlaceFormValues>;\n  setValue: UseFormSetValue<PlaceFormValues>;\n  getValues: UseFormGetValues<PlaceFormValues>;\n}'
)

# Update component signature
content = content.replace(
    'export const ImageSection: React.FC<ImageSectionProps> = ({ control, errors }) => {',
    'export const ImageSection: React.FC<ImageSectionProps> = ({ control, errors, setValue, getValues }) => {'
)

# Update handleAddUrl to fetch metadata
new_handle_add_url = """
          const handleAddUrl = async () => {
            setErrorMessage(null);
            const trimmed = newImageUrl.trim();
            if (!trimmed) {
              setErrorMessage("Please enter a valid image URL");
              return;
            }
            if (currentImages.includes(trimmed)) {
              setErrorMessage("This image URL is already added");
              return;
            }
            if (currentImages.length >= 10) {
              setErrorMessage("Maximum limit of 10 images reached");
              return;
            }

            try {
              setIsUploading(true);
              setUploadProgress("Fetching metadata from Flickr/Wikimedia...");
              const res = await fetch(`/api/metadata?url=${encodeURIComponent(trimmed)}`);
              const data = await res.json();
              if (res.ok && data.success) {
                field.onChange([...currentImages, data.data.imageUrl]);
                const currentCredits = getValues("credits") || [];
                setValue("credits", [...currentCredits, {
                  imageUrl: data.data.imageUrl,
                  author: data.data.author,
                  license: data.data.license,
                  licenseUrl: data.data.licenseUrl || "",
                  sourceUrl: data.data.sourceUrl
                }]);
                setNewImageUrl("");
              } else {
                setErrorMessage(data.error || "Failed to fetch metadata. Only Wikimedia and Flickr are allowed.");
              }
            } catch (err) {
              setErrorMessage("Network error while fetching metadata.");
            } finally {
              setIsUploading(false);
              setUploadProgress(null);
            }
          };
"""

content = re.sub(
    r'const handleAddUrl = \(\) => \{[\s\S]*?setNewImageUrl\(""\);\n          \};',
    new_handle_add_url.strip(),
    content
)

# Update handleRemoveImage to also remove credits
new_handle_remove = """
          const handleRemoveImage = (indexToRemove: number) => {
            const currentCredits = getValues("credits") || [];
            field.onChange(currentImages.filter((_, idx) => idx !== indexToRemove));
            setValue("credits", currentCredits.filter((_, idx) => idx !== indexToRemove));
          };
"""
content = re.sub(
    r'const handleRemoveImage = \(indexToRemove: number\) => \{[\s\S]*?\};',
    new_handle_remove.strip(),
    content
)

# Update handleFileUpload to prompt for credits (add default empty credits)
# Note: we need to handle credits for uploaded files. The user can fill them out in the UI.
# In handleFileUpload:
new_handle_upload = """
    if (uploadedUrls.length > 0) {
      onChange([...currentImages, ...uploadedUrls]);
      const currentCredits = getValues("credits") || [];
      const newCredits = uploadedUrls.map(url => ({
        imageUrl: url,
        author: "",
        license: "",
        licenseUrl: "",
        sourceUrl: ""
      }));
      setValue("credits", [...currentCredits, ...newCredits]);
    }
"""
content = re.sub(
    r'if \(uploadedUrls\.length > 0\) \{\n\s*onChange\(\[\.\.\.currentImages, \.\.\.uploadedUrls\]\);\n\s*\}',
    new_handle_upload.strip(),
    content
)

# Add credit inputs to the gallery cards
card_replacement = """
                          {/* Primary Cover Badge */}
                          {index === 0 && (
                            <span className="absolute top-2 left-2 bg-violet-600/90 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md">
                              Primary
                            </span>
                          )}
                        </div>
                        {/* Credits Form */}
                        <div className="flex flex-col gap-1 mt-1">
                          <input
                            type="text"
                            placeholder="Author Name"
                            className="text-[10px] bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-slate-300 w-full"
                            value={(getValues("credits") || [])[index]?.author || ""}
                            onChange={(e) => {
                              const creds = [...(getValues("credits") || [])];
                              if (creds[index]) creds[index].author = e.target.value;
                              setValue("credits", creds);
                            }}
                          />
                          <input
                            type="text"
                            placeholder="License (e.g. CC BY)"
                            className="text-[10px] bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-slate-300 w-full"
                            value={(getValues("credits") || [])[index]?.license || ""}
                            onChange={(e) => {
                              const creds = [...(getValues("credits") || [])];
                              if (creds[index]) creds[index].license = e.target.value;
                              setValue("credits", creds);
                            }}
                          />
                        </div>
                      </div>
"""
content = content.replace(
    '''                          {/* Primary Cover Badge */}
                          {index === 0 && (
                            <span className="absolute top-2 left-2 bg-violet-600/90 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md">
                              Primary
                            </span>
                          )}
                        </div>''',
    card_replacement
)

# Fix outer div for the new inputs
content = content.replace(
    'key={index}\n                          className="relative group rounded-xl overflow-hidden',
    'key={index}\n                          className="flex flex-col gap-1"\n                        >\n                        <div className="relative group rounded-xl overflow-hidden'
)


with open('src/components/ImageSection.tsx', 'w') as f:
    f.write(content)
