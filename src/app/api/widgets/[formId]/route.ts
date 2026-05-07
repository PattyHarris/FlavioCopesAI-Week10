import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      formId: string;
    }>;
  },
) {
  const { formId } = await context.params;

  const widgetBootstrap = `
(function () {
  var root = document.currentScript && document.currentScript.parentElement;
  if (!root) return;
  var panel = document.createElement("div");
  panel.innerHTML = '<div style="font-family: Arial, sans-serif; border: 1px solid #d0d7de; border-radius: 16px; padding: 16px; max-width: 420px;"><strong>What's new widget</strong><p style="color:#4b5563;">Form ${formId} will render here.</p><button style="background:#312E81;color:#fff;border:0;border-radius:999px;padding:12px 16px;">Join newsletter</button></div>';
  root.appendChild(panel);
})();`;

  return new NextResponse(widgetBootstrap, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
    },
  });
}
