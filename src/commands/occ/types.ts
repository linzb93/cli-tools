export interface MeituanLoginParams {
  appKey: string;
  shopId: string;
  platform: number;
}
export interface EleLoginParams {
  shopId: string;
  userId: string;
}
export interface ShopItem extends MeituanLoginParams, EleLoginParams {
  memeberName?: string;
  shopName?: string;
  startTime: string;
  endTime: string;
  price: string;
}
