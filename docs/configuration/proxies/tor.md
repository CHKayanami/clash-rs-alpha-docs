# Tor

Tor 节点通过 Tor 网络访问目标。节点类型为 `tor`，仅支持 TCP，不支持 UDP 或前置代理 `connect-via`。

## 示例

```yaml
proxies:
  - name: Tor-Node
    type: tor
```

只需填写名称和类型，不需要额外的 Tor SOCKS 代理。首次连接可能需要等待 Tor 网络准备完成。当前不能在节点中自定义网桥或出口节点。
