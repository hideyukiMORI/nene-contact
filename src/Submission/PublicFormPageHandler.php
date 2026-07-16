<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use Nene2\Error\ProblemDetailsResponseFactory;
use Nene2\Routing\Router;
use Nyholm\Psr7\Factory\Psr17Factory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * Public, unauthenticated hosted form page. GET /form/{public_form_key}
 *
 * Serves a minimal HTML page that loads embed.js in **inline** mode, so a form can be linked to
 * directly. Used where a host page's HTML sanitizer strips `<script>`/`<form>` and the embed
 * snippet cannot be inlined (AYANE `/contact`; records trusted-embed #802 is the later fix). The
 * chrome is deliberately minimal ENGINEERED (生成地 paper / 墨 ink / Zen Kaku) — the form is the
 * page. The form itself is themed by its own `appearance_json`; nothing here overrides it.
 *
 * The embed script is emitted **without `async`**: inline mode relies on `document.currentScript`
 * to place the form, which is null for async scripts.
 */
final readonly class PublicFormPageHandler implements RequestHandlerInterface
{
    /**
     * CSP for this page. The app default is `default-src 'self'`, which would block the embedded
     * form: scripts stay same-origin (embed.js is served here, SRI-pinned), but the form needs
     * inline styles (its shadow-DOM `<style>`) and the Zen Kaku webfont from Google Fonts. This is
     * set on the response so {@see \Nene2\Middleware\SecurityHeadersMiddleware} leaves it (it only
     * fills headers that are absent). Everything not needed stays locked to 'self'.
     */
    private const CONTENT_SECURITY_POLICY =
        "default-src 'self'; "
        . "script-src 'self'; "
        . "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        . "font-src 'self' https://fonts.gstatic.com; "
        . "img-src 'self' data:; "
        . "connect-src 'self'; "
        . "base-uri 'self'; "
        . "form-action 'self'";

    public function __construct(
        private PublicFormReaderInterface $forms,
        private Psr17Factory $psr17,
        private ProblemDetailsResponseFactory $problemDetails,
        private string $embedManifestPath,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $parameters = (array) $request->getAttribute(Router::PARAMETERS_ATTRIBUTE, []);
        $key = (string) ($parameters['public_form_key'] ?? '');

        $form = $this->forms->findByPublicFormKey($key);
        if ($form === null || $form->status !== 'active') {
            return $this->problemDetails->create($request, 'contact-form-not-found', 'Contact Form Not Found', 404, 'The requested form was not found.');
        }

        $response = $this->psr17->createResponse(200)
            ->withHeader('Content-Type', 'text/html; charset=UTF-8')
            ->withHeader('Cache-Control', 'no-cache')
            ->withHeader('Content-Security-Policy', self::CONTENT_SECURITY_POLICY);
        $response->getBody()->write($this->render($key));

        return $response;
    }

    private function render(string $key): string
    {
        [$embedSrc, $integrity] = $this->embedAsset();
        $k = htmlspecialchars($key, ENT_QUOTES, 'UTF-8');
        $src = htmlspecialchars($embedSrc, ENT_QUOTES, 'UTF-8');
        $sri = htmlspecialchars($integrity, ENT_QUOTES, 'UTF-8');

        $script = $sri !== ''
            ? "<script src=\"{$src}\" data-form=\"{$k}\" data-trigger=\"inline\" integrity=\"{$sri}\" crossorigin=\"anonymous\"></script>"
            : "<script src=\"{$src}\" data-form=\"{$k}\" data-trigger=\"inline\"></script>";

        return <<<HTML
<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>お問い合わせ</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap" rel="stylesheet">
<style>
:root{--paper:#efebe1;--ink:#14120f;--accent:#d64525}
*{box-sizing:border-box}
html,body{margin:0}
body{min-height:100vh;background:var(--paper);color:var(--ink);font-family:'Zen Kaku Gothic New',-apple-system,BlinkMacSystemFont,'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif;display:flex;justify-content:center;padding:40px 16px}
main{width:100%;max-width:560px}
noscript{display:block;text-align:center;color:var(--ink)}
</style>
</head>
<body>
<main>
<noscript>このフォームの表示には JavaScript が必要です。</noscript>
{$script}
</main>
</body>
</html>
HTML;
    }

    /**
     * The hashed embed path and its SRI from the build manifest, so the page always serves the
     * currently-built asset. Falls back to the unhashed name (no SRI) if the manifest is absent.
     *
     * @return array{0: string, 1: string} [src, integrity]
     */
    private function embedAsset(): array
    {
        $src = '/embed/embed.js';
        $integrity = '';

        if (is_file($this->embedManifestPath)) {
            $manifest = json_decode((string) file_get_contents($this->embedManifestPath), true);
            if (is_array($manifest)) {
                $file = is_string($manifest['file'] ?? null) ? $manifest['file'] : '';
                if ($file !== '') {
                    $src = '/' . ltrim($file, '/');
                }
                $integrity = is_string($manifest['integrity'] ?? null) ? $manifest['integrity'] : '';
            }
        }

        return [$src, $integrity];
    }
}
