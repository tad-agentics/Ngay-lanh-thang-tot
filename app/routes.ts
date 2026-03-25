import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/landing.tsx"),
  route("auth/callback", "routes/auth.callback.tsx"),
  route("dang-nhap", "routes/dang-nhap.tsx"),
  route("dang-nhap/email", "routes/dang-nhap.email.tsx"),
  route("dang-ky", "routes/dang-ky.tsx"),
  route("quen-mat-khau", "routes/quen-mat-khau.tsx"),
  route("app", "routes/app.tsx", [index("routes/app.home.tsx")]),
] satisfies RouteConfig;
