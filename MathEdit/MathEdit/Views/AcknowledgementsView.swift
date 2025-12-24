import SwiftUI

struct AcknowledgementsView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Open Source Libraries")
                    .font(.headline)

                Text("MathEdit uses the following open source libraries:")
                    .foregroundStyle(.secondary)

                VStack(alignment: .leading, spacing: 12) {
                    LicenseItemView(
                        name: "MathJax",
                        url: "https://www.mathjax.org",
                        license: "Apache License 2.0",
                        copyright: "© 2009-2024 The MathJax Consortium"
                    )

                    LicenseItemView(
                        name: "Sparkle",
                        url: "https://sparkle-project.org",
                        license: "MIT License",
                        copyright: "© 2006-2024 Andy Matuschak, Sparkle Project"
                    )

                    LicenseItemView(
                        name: "Monaco Editor",
                        url: "https://microsoft.github.io/monaco-editor",
                        license: "MIT License",
                        copyright: "© 2016-2024 Microsoft Corporation"
                    )

                    LicenseItemView(
                        name: "React",
                        url: "https://react.dev",
                        license: "MIT License",
                        copyright: "© Meta Platforms, Inc. and affiliates"
                    )

                    LicenseItemView(
                        name: "Zustand",
                        url: "https://zustand.docs.pmnd.rs",
                        license: "MIT License",
                        copyright: "© 2019 Paul Henschel"
                    )

                    LicenseItemView(
                        name: "JSZip",
                        url: "https://stuk.github.io/jszip",
                        license: "MIT License",
                        copyright: "© 2009-2016 Stuart Knightley"
                    )
                }
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .frame(width: 400, height: 380)
    }
}

private struct LicenseItemView: View {
    let name: String
    let url: String
    let license: String
    let copyright: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(spacing: 4) {
                Text(name)
                    .fontWeight(.medium)

                if let linkURL = URL(string: url) {
                    Link(destination: linkURL) {
                        Image(systemName: "arrow.forward.circle")
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(.secondary)
                    .help(url)
                }
            }

            Text(license)
                .font(.caption)
                .foregroundStyle(.secondary)

            Text(copyright)
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
    }
}

#Preview {
    AcknowledgementsView()
}
