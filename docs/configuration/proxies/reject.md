# Reject

`type: reject`，拒绝匹配的连接。内置名称 `REJECT` 可直接用于规则和策略组。

## 自定义名称

```yaml
proxies:
  - name: Blocked
    type: reject
```

只需填写名称和类型，再在规则或策略组中引用该名称。例如，可用它阻止广告或指定网站的访问。
