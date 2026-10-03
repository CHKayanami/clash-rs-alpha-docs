# SSH

SSH 节点可以借助已有的 SSH 服务器转发网页、下载等 TCP 流量。节点类型为 `ssh`；当前不支持 UDP 或前置代理 `connect-via`。

## 示例

```yaml
proxies:
  - name: SSH-Node
    type: ssh
    server: ssh.example.com
    port: 22
    username: example-user
    password: example-password
    # host-key:
    #   - "ssh-ed25519 <SERVER_PUBLIC_KEY>"
    host-key-algorithms:
      - ssh-ed25519
```

## 认证与主机公钥

- `username` 必填。配置 `password` 或 `private-key`；私钥值可用文件路径或内联 OpenSSH PEM，文件形式的加密私钥使用 `private-key-passphrase`。
- `host-key` 是完整 OpenSSH 服务端公钥列表（如 `ssh-ed25519 AAAA...`），不是 SHA-256 指纹字符串，也不是 known_hosts 文件路径。
- 不填写 `host-key` 时不会固定检查服务器公钥，也不会自动使用系统 known_hosts。需要确认连接的是指定服务器时填写该列表。
- `host-key-algorithms` 支持 `ssh-ed25519`、`rsa-sha2-256`、`rsa-sha2-512`、`ssh-rsa` 和 `ecdsa-sha2-nistp256/384/521`。

## TOTP

服务端要求动态口令时，可配置 `totp-opt`。填写 `otp-auth` 时使用认证器提供的 **Base32 密钥**，不要填写 `otpauth://` 链接：

```yaml
totp-opt:
  otp-auth: <BASE32_SECRET>
```

或显式配置算法和时间参数（secret 仍需替换）：

```yaml
totp-opt:
  common:
    secret: <BASE32_SECRET>
    algorithm: SHA1
    digits: 6
    step: 30
    screw: 1
```

`step` 为口令更新间隔（秒），`screw` 为允许的时间偏差步数。此功能需要服务端支持动态口令登录。
