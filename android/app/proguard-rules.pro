# Gson
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.maozi.cloud.data.model.** { *; }
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}
