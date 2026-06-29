# SolidWorksNativeHost

Windows-native host for the dashboard plus a reparented SolidWorks desktop window.

## Requirements

- Windows
- SolidWorks installed and licensed
- .NET 8 SDK
- Microsoft Edge

## Run

```powershell
cd bridge\SolidWorksNativeHost
dotnet run
```

The host opens the GitHub Pages dashboard in an embedded Edge app window on the left and attaches or launches SolidWorks on the right. It reparents both native windows into the WPF surface with Win32 `SetParent`, so this is the native-window path that a browser-only GitHub Pages app cannot provide by itself.

For best results, run `bridge\SolidWorksBridge` at the same time so the dashboard buttons can send parameters, design tables, simulation requests, material/LCA checks, and agent workflow requests to SolidWorks automation endpoints.
