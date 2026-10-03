# Direct

`type: direct`，直连目标 TCP/UDP。内置名称 `DIRECT` 可直接用于规则和策略组，无需再声明节点。

## 自定义名称

```yaml
proxies:
  - name: Local-Direct
    type: direct
```

只需填写名称和类型。若要指定出口网卡，使用 [通用网络设置](/configuration/general)，无需给直连节点填写服务器或端口。
