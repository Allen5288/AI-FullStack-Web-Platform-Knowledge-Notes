When you generate the S3 key and url, there will not any reacords in S3 when you see S3 resource, only if you upload file on it, you can see it. some commands can be used to uload:

pload a 10MB test file to the presigned URL you supplied using the exact headers the presigner required, then report the result and what's next.
```bash
dd if=/dev/zero of=/tmp/upload.bin bs=1048576 count=10 && ls -lh /tmp/upload.bin && curl -v -X PUT --upload-file /tmp/upload.bin ---Replace URL Here--- -H "x-amz-server-side-encryption: aws:kms" -H "x-amz-server-side-encryption-bucket-key-enabled: true" -H "Content-Length: 10485760" -H "Content-Type: application/octet-stream" -w '\nHTTP_STATUS:%{http_code}\n' -o /tmp/curl_out.bin
```