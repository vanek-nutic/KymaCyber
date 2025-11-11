import { SplineScene } from "./SplineScene";
import { Spotlight } from "./Spotlight";

export function SplineDemo() {
  return (
    <div className="w-full h-[500px] bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden rounded-lg border border-green-500/20">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="#00ff00"
      />
      
      <div className="flex h-full flex-col md:flex-row">
        {/* Left content */}
        <div className="flex-1 p-8 relative z-10 flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-green-400 to-green-600">
            Interactive 3D
          </h1>
          <p className="mt-4 text-green-300/80 max-w-lg">
            Bring your UI to life with beautiful 3D scenes. Create immersive experiences 
            that capture attention and enhance your cyber design.
          </p>
          <div className="mt-6 text-sm text-green-500/60">
            ⚡ Powered by Spline
          </div>
        </div>

        {/* Right content - 3D Scene */}
        <div className="flex-1 relative">
          <SplineScene 
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}
