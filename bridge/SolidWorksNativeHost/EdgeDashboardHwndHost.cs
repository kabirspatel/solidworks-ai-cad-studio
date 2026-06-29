using System.Diagnostics;
using System.Windows;
using System.Windows.Interop;

namespace SolidWorksNativeHost;

public sealed class EdgeDashboardHwndHost : HwndHost
{
    private const int GwlStyle = -16;
    private const long WsChild = 0x40000000;
    private const long WsVisible = 0x10000000;
    private const long WsPopup = 0x80000000;

    private IntPtr _containerHwnd;
    private IntPtr _edgeHwnd;
    private Process? _edgeProcess;
    private string _url = "https://kabirspatel.github.io/solidworks-ai-cad-studio/";
    private int _width = 620;
    private int _height = 720;

    public void Navigate(string url)
    {
        _url = url;
        if (_containerHwnd != IntPtr.Zero)
        {
            LaunchAndEmbed();
        }
    }

    protected override HandleRef BuildWindowCore(HandleRef hwndParent)
    {
        _containerHwnd = NativeMethods.CreateWindowEx(
            0,
            "static",
            "DashboardHostContainer",
            (int)(WsChild | WsVisible),
            0,
            0,
            _width,
            _height,
            hwndParent.Handle,
            IntPtr.Zero,
            IntPtr.Zero,
            IntPtr.Zero);

        LaunchAndEmbed();
        return new HandleRef(this, _containerHwnd);
    }

    protected override void DestroyWindowCore(HandleRef hwnd)
    {
        if (_edgeHwnd != IntPtr.Zero)
        {
            NativeMethods.SetParent(_edgeHwnd, IntPtr.Zero);
        }

        try
        {
            if (_edgeProcess is { HasExited: false })
            {
                _edgeProcess.CloseMainWindow();
            }
        }
        catch
        {
            // The host should close cleanly even if Edge has already exited.
        }

        if (hwnd.Handle != IntPtr.Zero)
        {
            NativeMethods.DestroyWindow(hwnd.Handle);
        }
    }

    protected override void OnWindowPositionChanged(Rect rcBoundingBox)
    {
        base.OnWindowPositionChanged(rcBoundingBox);
        _width = Math.Max(1, (int)rcBoundingBox.Width);
        _height = Math.Max(1, (int)rcBoundingBox.Height);
        ResizeEmbeddedWindow();
    }

    private void LaunchAndEmbed()
    {
        if (_containerHwnd == IntPtr.Zero) return;
        CloseExistingEdgeWindow();

        var userDataDir = Path.Combine(Path.GetTempPath(), "SolidWorksNativeHost-Edge");
        Directory.CreateDirectory(userDataDir);

        var edgePath = FindEdgePath();
        var args = $"--app={Quote(_url)} --user-data-dir={Quote(userDataDir)} --window-size={_width},{_height}";
        _edgeProcess = Process.Start(new ProcessStartInfo(edgePath, args)
        {
            UseShellExecute = false
        });

        _edgeHwnd = WaitForMainWindow(_edgeProcess);
        if (_edgeHwnd == IntPtr.Zero) return;

        NativeMethods.SetParent(_edgeHwnd, _containerHwnd);
        var style = NativeMethods.GetWindowLongPtr(_edgeHwnd, GwlStyle).ToInt64();
        style = (style | WsChild | WsVisible) & ~WsPopup;
        NativeMethods.SetWindowLongPtr(_edgeHwnd, GwlStyle, new IntPtr(style));
        ResizeEmbeddedWindow();
    }

    private void CloseExistingEdgeWindow()
    {
        try
        {
            if (_edgeProcess is { HasExited: false })
            {
                NativeMethods.SetParent(_edgeHwnd, IntPtr.Zero);
                _edgeProcess.CloseMainWindow();
            }
        }
        catch
        {
            // Starting a fresh embedded app window is more important than preserving the old one.
        }

        _edgeHwnd = IntPtr.Zero;
        _edgeProcess = null;
    }

    private void ResizeEmbeddedWindow()
    {
        if (_edgeHwnd != IntPtr.Zero)
        {
            NativeMethods.MoveWindow(_edgeHwnd, 0, 0, _width, _height, true);
        }
    }

    private static IntPtr WaitForMainWindow(Process? process)
    {
        if (process is null) return IntPtr.Zero;
        for (var attempt = 0; attempt < 60; attempt += 1)
        {
            process.Refresh();
            if (process.MainWindowHandle != IntPtr.Zero) return process.MainWindowHandle;
            Thread.Sleep(250);
        }

        return IntPtr.Zero;
    }

    private static string FindEdgePath()
    {
        var candidates = new[]
        {
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Microsoft", "Edge", "Application", "msedge.exe"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Microsoft", "Edge", "Application", "msedge.exe"),
            "msedge.exe"
        };

        return candidates.FirstOrDefault(File.Exists) ?? "msedge.exe";
    }

    private static string Quote(string value)
    {
        return $"\"{value.Replace("\"", "\\\"")}\"";
    }
}
