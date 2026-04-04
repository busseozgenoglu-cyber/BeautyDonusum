/**
 * Büyük base64 fotoğrafı expo-router URL parametresi olarak taşımak
 * URL uzunluk limitini aşar ve crash'e yol açar.
 * Bu basit in-memory store, camera → loading arasında güvenli aktarım sağlar.
 */
export const pendingPhotoStore: { photo: string | null } = {
  photo: null,
};
