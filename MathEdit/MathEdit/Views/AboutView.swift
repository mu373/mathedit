import SwiftUI
import AppKit.NSApplication

struct AboutView: View {
    @Environment(\.openWindow) private var openWindow

    var body: some View {
        VStack(spacing: 8) {
            Image(nsImage: NSApp.applicationIconImage)
                .accessibilityLabel("\(Bundle.main.bundleName) icon")

            Text(Bundle.main.bundleName)
                .font(.title)

            Text("Version \(Bundle.main.shortVersion) (\(Bundle.main.bundleVersion))")

            Text(Bundle.main.copyright)
                .font(.footnote)
                .foregroundStyle(.secondary)
                .padding(.bottom, 8)

            Button("Acknowledgements") {
                openWindow(id: "acknowledgements")
            }
            .padding(.bottom, 12)
        }
        .textSelection(.enabled)
        .multilineTextAlignment(.center)
        .padding(20)
        .frame(width: 280)
        .fixedSize()
    }
}

#Preview {
    AboutView()
}
