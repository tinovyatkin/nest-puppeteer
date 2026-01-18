# Automation Detection Avoidance - Analysis and Implementation

This document analyzes the stealth evasions from `puppeteer-extra-plugin-stealth` and explains why most are no longer needed with modern Chrome
headless mode.

## Background

The `puppeteer-extra-plugin-stealth` plugin was created to make headless Chrome harder to detect. It implemented 16 different evasions targeting
various detection vectors.

However, **Chrome 112+ introduced a new headless mode** that is essentially a full browser without a window. This change made most stealth evasions
obsolete.

## What New Chrome Headless Mode Fixes Automatically

| Detection Vector                     | Old Headless | New Headless (`headless: true`) |
| ------------------------------------ | ------------ | ------------------------------- |
| User-Agent contains "HeadlessChrome" | Yes          | **No** - Normal UA              |
| `window.chrome` object               | Missing      | **Present**                     |
| `window.chrome.app`                  | Missing      | **Present**                     |
| `window.chrome.csi`                  | Missing      | **Present**                     |
| `window.chrome.loadTimes`            | Missing      | **Present**                     |
| `window.chrome.runtime`              | Missing      | **Present**                     |
| `navigator.plugins`                  | Empty        | **Populated**                   |
| `navigator.mimeTypes`                | Empty        | **Populated**                   |
| `navigator.languages`                | Works        | Works                           |
| `navigator.permissions`              | Broken       | **Works**                       |
| Media codec support                  | Limited      | **Full**                        |
| Window dimensions                    | Abnormal     | **Normal**                      |

## What Still Needs Attention

| Detection Vector        | Status                                | Solution                                                   |
| ----------------------- | ------------------------------------- | ---------------------------------------------------------- |
| `navigator.webdriver`   | **Still true by default**             | `--disable-blink-features=AutomationControlled` launch arg |
| WebGL vendor/renderer   | Shows "Google SwiftShader" (software) | Optional: Override via `evaluateOnNewDocument`             |
| TLS fingerprint         | Detectable                            | **Cannot fix** - Chrome's TLS stack                        |
| CDP sourceURL in stacks | Detectable if checked                 | Optional: Intercept CDP calls                              |

## Implementation in nest-puppeteer

Instead of importing the stale `puppeteer-extra-plugin-stealth` (last meaningful update was years ago), we implemented a minimal, focused approach:

### 1. Default Launch Argument (Implemented)

Added `--disable-blink-features=AutomationControlled` to default Chrome launch arguments in `src/puppeteer.constants.ts`:

```typescript
const args: string[] = [
  "--allow-insecure-localhost",
  "--allow-http-screen-capture",
  "--no-zygote",
  "--disable-blink-features=AutomationControlled", // Removes navigator.webdriver flag
];
```

This single change removes `navigator.webdriver = true`, which was one of the last obvious automation indicators.

### 2. Optional WebGL Override (User-Implemented)

For users who need WebGL fingerprint spoofing, documentation shows how to inject via `evaluateOnNewDocument`:

```typescript
await page.evaluateOnNewDocument(() => {
  const getParameterProxy = new Proxy(
    WebGLRenderingContext.prototype.getParameter,
    {
      apply(target, thisArg, args) {
        if (args[0] === 37445) return "Intel Inc.";
        if (args[0] === 37446) return "Intel Iris OpenGL Engine";
        return Reflect.apply(target, thisArg, args);
      },
    },
  );
  WebGLRenderingContext.prototype.getParameter = getParameterProxy;
  WebGL2RenderingContext.prototype.getParameter = getParameterProxy;
});
```

## Why Not Use puppeteer-extra?

1. **Stale**: The project hasn't been actively maintained for several years
2. **Unnecessary**: Most evasions target issues Chrome has since fixed
3. **Overhead**: Adds complexity and dependencies for minimal benefit
4. **New Headless**: Chrome's new headless mode made ~80% of evasions redundant

## Conclusion

For modern Chrome (112+) with `headless: true`:

- **Essential**: `--disable-blink-features=AutomationControlled` (included by default)
- **Optional**: WebGL vendor override (user can add if needed)
- **Cannot fix**: TLS fingerprinting (server-side detection)
- **Unnecessary**: All the `chrome.*` mocks, plugin arrays, permissions fixes, etc.

The minimal approach in nest-puppeteer provides equivalent protection to puppeteer-extra-plugin-stealth with zero additional dependencies and much
simpler code.
