import { Config } from "@remotion/cli/config";

// Serve assets directly from the mobile app's existing asset folder
Config.setPublicDir("../mobileApp/assets");
Config.setOverwriteOutput(true);
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
