import BackButton from "@/components/wrappers/common/button/back-button";

export default async function NotFound() {
  return (
    <div className="flex items-center min-h-screen px-4 py-12 sm:px-6 md:px-8 lg:px-12 xl:px-16">
      <div className="w-full space-y-6 text-center">
        <div className="space-y-3">
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
            Not found
          </h1>
          <p className="leading-7 not-first:mt-6">
            The content you are trying to view is not available.
          </p>
        </div>
        <BackButton>Go home</BackButton>
      </div>
    </div>
  );
}
