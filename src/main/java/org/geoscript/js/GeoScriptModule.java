package org.geoscript.js;

import java.net.URISyntaxException;
import java.net.URL;

public class GeoScriptModule {
    
    public static String getModulePath() {
        URL moduleUrl = GeoScriptModule.class.getResource("lib");
        String modulePath;
        try {
            modulePath = moduleUrl.toURI().toString();
        } catch (URISyntaxException e) {
            throw new RuntimeException("Trouble evaluating GeoScript module path.", e);
        }
        return modulePath;
    }

}
