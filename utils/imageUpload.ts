import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

/**
 * @param uri 
 * @param userId 
 * @param folderName 
 * @returns 
 */
export const uploadImageToFirebase = async (
  uri: string,
  userId?: string,
  folderName: string = "profileImages"
): Promise<string> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    const fileExtension = uri.split('.').pop();
    const timestamp = Date.now();
    const fileName = `${folderName}_${userId || timestamp}_${timestamp}.${fileExtension}`;
    
    const storage = getStorage();
    const storagePath = userId 
      ? `${folderName}/${userId}/${fileName}`
      : `${folderName}/${fileName}`;
    const storageRef = ref(storage, storagePath);
    
    await uploadBytes(storageRef, blob);
    
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

/**
 * @param userId 
 * @param photoURL 
 */
export const deleteOldProfileImage = async (userId: string, photoURL?: string | null): Promise<void> => {
  if (!photoURL) return;
  
  try {
    const storage = getStorage();
    

    if (photoURL.includes(userId)) {
      const photoRef = ref(storage, photoURL);
      
      await deleteObject(photoRef);
      console.log("Previous profile image deleted successfully");
    } else {
      console.log("Not deleting image as it may not belong to this user");
    }
  } catch (error) {
    console.error("Error deleting previous profile image:", error);
  }
};