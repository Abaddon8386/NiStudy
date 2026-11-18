# ADR-0001: Next.js App Router + Supabase cloud, không backend riêng

Trạng thái: Đã chấp nhận, 18/11/2026

## Bối cảnh

Dự án do một người làm, 10–15 giờ mỗi tuần, MVP khoảng 9/3/2027. Cần đăng nhập, CSDL, giao diện PWA, và vài việc phải chạy phía máy chủ (xác nhận email, xóa tài khoản). Ràng buộc: không Docker, không chạy Supabase trên máy (`docs/02-srs.md` mục 2.5). Chủ dự án quen HTML/CSS/JS và SQL/Supabase, chưa biết React/Next.js.

## Quyết định

- Giao diện và phần máy chủ nhẹ dùng một app Next.js (App Router, TypeScript, Tailwind), deploy trên Vercel.
- Đăng nhập và CSDL dùng Supabase bản cloud (Auth, Postgres, RLS, RPC).
- Trình duyệt gọi Supabase trực tiếp. Chỉ những việc cần khóa bí mật hoặc cookie phía máy chủ đi qua Route Handler của Next.js.
- Không có backend riêng (không Express, NestJS hay dịch vụ tự dựng).

## Hệ quả

- Ít thành phần phải dựng và vận hành. Một repo, một lần deploy.
- Logic bảo vệ dữ liệu nằm ở Postgres (RLS, RPC), nên phải viết và test kỹ SQL. Chủ dự án đã quen SQL nên phù hợp.
- Phụ thuộc Supabase và Vercel. Gói miễn phí có giới hạn, đặc biệt email mặc định (xem `docs/04-architecture.md` mục 13).
- Phải học React, TypeScript, Next.js trước sprint 1 (`docs/04-architecture.md` mục 16).

## Phương án đã cân nhắc

- **Backend riêng (Node/Express hoặc tương tự) + Postgres tự quản:** thêm một thành phần để dựng, deploy, bảo mật. Không cần thiết cho phạm vi MVP.
- **Frontend tĩnh (SPA) không có Route Handler:** xóa tài khoản cần khóa service role, không thể đặt ở trình duyệt (NFR-13). Cần một nơi chạy phía máy chủ.
- **Supabase chạy local bằng Docker:** loại vì ràng buộc ổ đĩa và quyết định không cài Docker.
