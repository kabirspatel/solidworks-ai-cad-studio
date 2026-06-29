using System.Windows;

namespace SolidWorksNativeHost;

public partial class MainWindow : Window
{
    private const string DefaultDashboardUrl = "https://kabirspatel.github.io/solidworks-ai-cad-studio/";

    public MainWindow()
    {
        InitializeComponent();
        DashboardUrlBox.Text = Environment.GetEnvironmentVariable("SOLIDWORKS_DASHBOARD_URL") ?? DefaultDashboardUrl;
        NavigateDashboard();
    }

    private void NavigateDashboard_Click(object sender, RoutedEventArgs e)
    {
        NavigateDashboard();
    }

    private void AttachSolidWorks_Click(object sender, RoutedEventArgs e)
    {
        SolidWorksHost.AttachOrLaunch();
    }

    private void NavigateDashboard()
    {
        if (Uri.TryCreate(DashboardUrlBox.Text.Trim(), UriKind.Absolute, out var uri))
        {
            DashboardHost.Navigate(uri.ToString());
        }
    }
}
