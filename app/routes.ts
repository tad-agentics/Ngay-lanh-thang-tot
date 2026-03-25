import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/landing.tsx"),
  route("auth/callback", "routes/auth.callback.tsx"),
  route("dang-nhap", "routes/dang-nhap.tsx"),
  route("dang-nhap/email", "routes/dang-nhap.email.tsx"),
  route("dang-ky", "routes/dang-ky.tsx"),
  route("quen-mat-khau", "routes/quen-mat-khau.tsx"),
  route("app", "routes/app.tsx", [
    index("routes/app.home.tsx"),
    route("hom-nay", "routes/app.hom-nay.tsx"),
    route("tuan-nay", "routes/app.tuan-nay.tsx"),
    route("chon-ngay", "routes/app.chon-ngay.tsx"),
    route("chon-ngay/ket-qua", "routes/app.chon-ngay.ket-qua.tsx"),
    route("lich-thang", "routes/app.lich-thang.tsx"),
    route("ngay/:ngay", "routes/app.ngay.$ngay.tsx"),
    route("bat-dau", "routes/app.bat-dau.tsx"),
    route("mua-luong", "routes/app.mua-luong.tsx"),
    route("mua-luong/thanh-cong", "routes/app.mua-luong.thanh-cong.tsx"),
    route("cai-dat", "routes/app.cai-dat.tsx"),
  ]),
] satisfies RouteConfig;
