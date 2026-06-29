using System.Diagnostics;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Interop;

namespace SolidWorksNativeHost;

public sealed class SolidWorksHwndHost : HwndHost
{
    private const int GwlStyle = -16;
    private const long WsChild = 0x40000000;
    private const long WsVisible = 0x10000000;
    private const long WsPopup = 0x80000000;

    private IntPtr _containerHwnd;
    private IntPtr _solidWorksHwnd;
    private int _width = 900;
    private int _height = 720;

    public void AttachOrLaunch()
    {
        _solidWorksHwnd = SolidWorksWindowLocator.GetOrLaunch();
        ReparentSolidWorks();
    }

    protected override HandleRef BuildWindowCore(HandleRef hwndParent)
    {
        _containerHwnd = NativeMethods.CreateWindowEx(
            0,
            "static",
            "SolidWorksHostContainer",
            (int)(WsChild | WsVisible),
            0,
            0,
            _width,
            _height,
            hwndParent.Handle,
            IntPtr.Zero,
            IntPtr.Zero,
            IntPtr.Zero);

        AttachOrLaunch();
        return new HandleRef(this, _containerHwnd);
    }

    protected override void DestroyWindowCore(HandleRef hwnd)
    {
        if (_solidWorksHwnd != IntPtr.Zero)
        {
            NativeMethods.SetParent(_solidWorksHwnd, IntPtr.Zero);
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

    private void ReparentSolidWorks()
    {
        if (_containerHwnd == IntPtr.Zero || _solidWorksHwnd == IntPtr.Zero) return;

        NativeMethods.SetParent(_solidWorksHwnd, _containerHwnd);
        var style = NativeMethods.GetWindowLongPtr(_solidWorksHwnd, GwlStyle).ToInt64();
        style = (style | WsChild | WsVisible) & ~WsPopup;
        NativeMethods.SetWindowLongPtr(_solidWorksHwnd, GwlStyle, new IntPtr(style));
        ResizeEmbeddedWindow();
    }

    private void ResizeEmbeddedWindow()
    {
        if (_solidWorksHwnd != IntPtr.Zero)
        {
            NativeMethods.MoveWindow(_solidWorksHwnd, 0, 0, _width, _height, true);
        }
    }
}

internal static class SolidWorksWindowLocator
{
    public static IntPtr GetOrLaunch()
    {
        var existingWindow = FindProcessWindow();
        if (existingWindow != IntPtr.Zero) return existingWindow;

        var app = GetSolidWorksApplication(createIfMissing: true);
        if (app is not null)
        {
            try
            {
                app.Visible = true;
            }
            catch
            {
                // Late-bound COM can fail when SolidWorks is still starting.
            }

            Thread.Sleep(1200);
            var frameWindow = TryGetFrameWindow(app);
            if (frameWindow != IntPtr.Zero) return frameWindow;
        }

        return FindProcessWindow();
    }

    private static dynamic? GetSolidWorksApplication(bool createIfMissing)
    {
        var type = Type.GetTypeFromProgID("SldWorks.Application");
        if (type is null) return null;
        try
        {
            return MarshalGetActiveObject("SldWorks.Application");
        }
        catch
        {
            return createIfMissing ? Activator.CreateInstance(type) : null;
        }
    }

    private static object MarshalGetActiveObject(string progId)
    {
        var type = Type.GetType("System.Runtime.InteropServices.Marshal");
        var method = type?.GetMethod("GetActiveObject", BindingFlags.Public | BindingFlags.Static);
        if (method is null) throw new InvalidOperationException("Marshal.GetActiveObject is unavailable.");
        return method.Invoke(null, new object[] { progId }) ?? throw new InvalidOperationException("Active COM object not found.");
    }

    private static IntPtr TryGetFrameWindow(dynamic app)
    {
        try
        {
            dynamic frame = app.Frame();
            return new IntPtr(Convert.ToInt64(frame.GetHWnd()));
        }
        catch
        {
            return IntPtr.Zero;
        }
    }

    private static IntPtr FindProcessWindow()
    {
        foreach (var process in Process.GetProcessesByName("SLDWORKS"))
        {
            try
            {
                process.Refresh();
                if (process.MainWindowHandle != IntPtr.Zero) return process.MainWindowHandle;
            }
            catch
            {
                // Ignore processes that exit while being inspected.
            }
        }

        return IntPtr.Zero;
    }
}

internal static partial class NativeMethods
{
    [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    internal static extern IntPtr CreateWindowEx(
        int dwExStyle,
        string lpClassName,
        string lpWindowName,
        int dwStyle,
        int x,
        int y,
        int nWidth,
        int nHeight,
        IntPtr hWndParent,
        IntPtr hMenu,
        IntPtr hInstance,
        IntPtr lpParam);

    [DllImport("user32.dll", SetLastError = true)]
    internal static extern bool DestroyWindow(IntPtr hWnd);

    [DllImport("user32.dll", SetLastError = true)]
    internal static extern IntPtr SetParent(IntPtr hWndChild, IntPtr hWndNewParent);

    [DllImport("user32.dll", SetLastError = true)]
    internal static extern bool MoveWindow(IntPtr hWnd, int x, int y, int nWidth, int nHeight, bool bRepaint);

    [DllImport("user32.dll", EntryPoint = "GetWindowLongPtr", SetLastError = true)]
    internal static extern IntPtr GetWindowLongPtr64(IntPtr hWnd, int nIndex);

    [DllImport("user32.dll", EntryPoint = "GetWindowLong", SetLastError = true)]
    private static extern IntPtr GetWindowLong32(IntPtr hWnd, int nIndex);

    [DllImport("user32.dll", EntryPoint = "SetWindowLongPtr", SetLastError = true)]
    internal static extern IntPtr SetWindowLongPtr64(IntPtr hWnd, int nIndex, IntPtr dwNewLong);

    [DllImport("user32.dll", EntryPoint = "SetWindowLong", SetLastError = true)]
    private static extern IntPtr SetWindowLong32(IntPtr hWnd, int nIndex, IntPtr dwNewLong);

    internal static IntPtr GetWindowLongPtr(IntPtr hWnd, int nIndex)
    {
        return IntPtr.Size == 8 ? GetWindowLongPtr64(hWnd, nIndex) : GetWindowLong32(hWnd, nIndex);
    }

    internal static IntPtr SetWindowLongPtr(IntPtr hWnd, int nIndex, IntPtr dwNewLong)
    {
        return IntPtr.Size == 8 ? SetWindowLongPtr64(hWnd, nIndex, dwNewLong) : SetWindowLong32(hWnd, nIndex, dwNewLong);
    }
}
