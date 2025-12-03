export const metadata = {
    title: "AI Bot Platform",
    description: "Control panel for your AI bot"
  };
  
  export default function RootLayout({ children }) {
    return (
      <html>
        <body style={{ margin: 0, fontFamily: "Arial" }}>
          {children}
        </body>
      </html>
    );
  }