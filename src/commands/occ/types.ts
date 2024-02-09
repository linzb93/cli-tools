export interface MeituanLoginParams {
  appKey: string;
  shopId?: string;
  memberId?: string;
  platform: number;
}
export interface EleLoginParams {
  shopId?: string;
  memberId?: string;
  userId: string;
}
export interface ShopItem extends MeituanLoginParams, EleLoginParams {
  memberName?: string;
  shopName?: string;
  startTime: string;
  endTime: string;
  price: string;
}
