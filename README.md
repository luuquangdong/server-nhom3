# API mạng xã hội thu nhỏ
## Hướng dẫn sử dụng
Để chạy được project thì cần tạo file .env đặt trong thư mục server-nhom3 với nội dung như sau:
```
TOKEN_SECRET=<secret>

# for connecting to cloud
CLOUD_NAME=<cloud name>
API_KEY=<api key>
API_SECRET=<api secret>

# for connecting to mongodb
MONGODB_URL=mongodb://localhost/<db name>
```
Giá trị của CLOUD_NAME, API_KEY, API_SECRET thì đăng ký tài khoản trên cloudinary rồi gán giá trị tương ứng \
Project cần cài thêm MongoDB, download tại [đây](https://www.mongodb.com/try/download/community), rồi sửa \<db name\> trên MONGODB_URL tương ứng với db mà bạn muốn tạo

Đường dẫn của mỗi api sẽ có tiền tố it4788 ở phía trước, ví dụ muốn gọi API signup thì url đầy đủ sẽ là: http://localhost/it4788/signup \
Các param của mỗi API các bạn có thể tham khảo tại [đây](https://drive.google.com/drive/folders/1qdABrUqQXWX-WbbrkqbRVquMbVKz5J5Z?usp=share_link)

---
### Danh sách api đã hoàn thành:
1. signup
2. login
3. logout
4. get_verify_code
5. check_verify_code
6. change_info_after_signup
7. change_pass_word
8. set_user_info
9. get_user_info
10. add_post
11. delete_post
12. get_post
13. get_list_posts
14. report_post
15. set_comment
16. get_comment
17. search
18. get_saved_search
19. del_saved_search
20. set_accept_friend
21. set_request_friend
22. get_requested_friends
23. get_user_friends
24. get_list_suggested_friends
25. set_block
26. like
27. get_list_blocks
28. get_push_settings
29. set_push_settings
30. set_devtoken
