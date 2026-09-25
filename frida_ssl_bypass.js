// frida_ssl_bypass.js
// Bypass SSL pinning + capture all URLs requested by SportzX
Java.perform(function() {
    console.log("[*] SportzX SSL Pinning Bypass + URL Capture loaded");

    // 1. Bypass custom TrustManager (App.java lines 160-167)
    var X509TrustManager = Java.use('javax.net.ssl.X509TrustManager');
    var SSLContext = Java.use('javax.net.ssl.SSLContext');

    var TrustManager = Java.registerClass({
        name: 'com.sportzx.bypass.TrustManager',
        implements: [X509TrustManager],
        methods: {
            checkClientTrusted: function(chain, authType) {},
            checkServerTrusted: function(chain, authType) {},
            getAcceptedIssuers: function() { return []; }
        }
    });

    var TrustManagers = [TrustManager.$new()];
    var SSLContextInstance = SSLContext.getInstance('TLS');
    SSLContextInstance.init(null, TrustManagers, null);

    // 2. Bypass OkHttp certificate pinning
    try {
        var CertificatePinner = Java.use('okhttp3.CertificatePinner');
        CertificatePinner.check.overload('java.lang.String', 'java.util.List').implementation = function(hostname, certs) {
            console.log("[+] OkHttp pin bypassed for: " + hostname);
        };
        CertificatePinner.check.overload('java.lang.String', '[Ljava.security.cert.Certificate;').implementation = function(hostname, certs) {
            console.log("[+] OkHttp pin bypassed for: " + hostname);
        };
    } catch(e) {}

    // 3. Capture all URLs from HttpURLConnection
    var URL = Java.use('java.net.URL');
    URL.openConnection.overload().implementation = function() {
        console.log("[URL] " + this.toString());
        return this.openConnection();
    };

    // 4. Capture OkHttp requests
    try {
        var OkHttpClient = Java.use('okhttp3.OkHttpClient');
        var Request = Java.use('okhttp3.Request');
        var RealCall = Java.use('okhttp3.RealCall');
        RealCall.execute.implementation = function() {
            var request = this.request();
            console.log("[OKHTTP] " + request.method() + " " + request.url());
            var headers = request.headers();
            if (headers) {
                var names = headers.names();
                for (var i = 0; i < names.size(); i++) {
                    var name = names.get(i);
                    console.log("  Header: " + name + ": " + headers.get(name));
                }
            }
            return this.execute();
        };
    } catch(e) {}

    // 5. Capture WebView URLs
    var WebView = Java.use('android.webkit.WebView');
    WebView.loadUrl.overload('java.lang.String').implementation = function(url) {
        console.log("[WEBVIEW] " + url);
        return this.loadUrl(url);
    };

    // 6. Capture the DataHelper.native help method result
    var DataHelper = Java.use('com.sportzx.live.helpers.DataHelper');
    DataHelper.help.implementation = function(context, input) {
        var result = this.help(context, input);
        console.log("[DATAHELPER] input=" + input + " => " + result);
        return result;
    };

    console.log("[*] All hooks installed");
});
