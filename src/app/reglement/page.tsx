import ReactMarkdown from "react-markdown";
import { promises as fs } from "fs";
import path from "path";

// This function runs on the server at request time
async function getRulesContent() {
  try {
    const filePath = path.join(process.cwd(), "docs", "classment.md");
    const content = await fs.readFile(filePath, "utf8");
    return content;
  } catch (error) {
    console.error("Error reading rules file:", error);
    return "# Error loading rules content";
  }
}

export default async function RulesPage() {
  const content = await getRulesContent();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white shadow dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Rules and Regulations
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <article className="prose prose-slate max-w-none dark:prose-invert lg:prose-lg">
          <ReactMarkdown>{content}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
}