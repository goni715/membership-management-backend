import DB from "../db";

export default async function (userId: string) {
  const user = await DB.UserModel.findById(userId);
  if (
    user?.isSubscribed &&
    user?.subscriptionExpiry &&
    new Date() > user?.subscriptionExpiry
  ) {
    await DB.UserModel.findByIdAndUpdate(user?._id, {
      isSubscribed: false,
    });
    return;
  }
}
