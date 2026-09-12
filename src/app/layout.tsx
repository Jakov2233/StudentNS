import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import CookieConsent from "@/components/CookieConsent";
import ErrorReporter from "@/components/ErrorReporter";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudentNS | Studentski vodič kroz Novi Sad",
  description:
    "Interaktivna mapa Novog Sada sa fakultetima, domovima, menzama, kafićima, mestima za učenje i korisnim lokacijama za studente.",
  referrer: "strict-origin-when-cross-origin",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="sr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  var url="https://emcildxmamroodpwxesi.supabase.co";
  var key="${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""}";
  if(!key) return;
  var last=0;
  function send(component,err){
    var now=Date.now();
    if(now-last<2000) return; last=now;
    var m=err&&err.message!==undefined?err.message:String(err||"Nepoznata greska");
    var s=err&&err.stack!==undefined?String(err.stack):"";
    try{
      fetch(url+"/rest/v1/client_errors",{
        method:"POST",
        headers:{"apikey":key,"Authorization":"Bearer "+key,"Content-Type":"application/json","Prefer":"return=minimal"},
        body:JSON.stringify({
          url:location.href.slice(0,1000),
          message:String(m).slice(0,2000),
          stack:String(s).slice(0,2000),
          component:component,
          user_agent:navigator.userAgent.slice(0,500)
        })
      }).catch(function(){});
    }catch(e){}
  }
  window.addEventListener("error",function(e){
    send("early.window.onerror",e.error||e.message||e);
  },true);
  window.addEventListener("unhandledrejection",function(e){
    send("early.unhandledrejection",e.reason);
  },true);
})();`,
          }}
        />
      </head>
      <body className="min-h-full">
        {children}
        <ErrorReporter />
        <CookieConsent />
      </body>
    </html>
  );
}