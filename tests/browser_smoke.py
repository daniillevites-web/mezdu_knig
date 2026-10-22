"""Browser regression checks for the static site; requires Playwright and Chromium."""
import functools
import http.server
from pathlib import Path
import shutil
import threading
from playwright.sync_api import sync_playwright

class QuietHandler(http.server.SimpleHTTPRequestHandler):

    def log_message(self, *args):
        pass

def run_checks(base_url):
    results = []

    def check(value, label):
        assert value, label
        results.append(label)
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=shutil.which('chromium') or shutil.which('chromium-browser') or None, headless=True, args=['--no-sandbox'])
        for width, height in [(1440, 1000), (390, 844), (320, 740), (768, 1024)]:
            context = browser.new_context(viewport={'width': width, 'height': height}, reduced_motion='reduce', has_touch=width < 500)
            page = context.new_page()
            errors = []
            failed = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.on('response', lambda r: failed.append((r.status, r.url)) if r.status >= 400 else None)
            page.goto(base_url, wait_until='networkidle')
            page.locator('#artists').scroll_into_view_if_needed()
            check(page.locator('.portrait-slide').count() == 20, f'{width}: 20 carousel entries')
            check(page.locator('.artist-roster [data-art]').count() == 20, f'{width}: 20 directly reachable authors')
            for i in range(20):
                button = page.locator(f'.artist-roster [data-art="{i}"]')
                button.click()
                check(page.locator('#art-dialog').evaluate('(d)=>d.open'), f'{width}: author {i + 1} opens')
                check(page.locator('#dialog-image').evaluate('(im)=>im.decode().then(()=>im.naturalWidth>0)'), f'{width}: artwork {i + 1} loads')
                page.keyboard.press('Escape')
                check(button.evaluate('(el)=>el===document.activeElement'), f'{width}: author {i + 1} focus restored')
            page.locator('.artist-roster [data-art="8"]').click()
            check('28.693.33' in page.locator('#dialog-details').inner_text(), f'{width}: frog placement shown')
            page.locator('.installation-photo').click()
            check(page.locator('#photo-dialog').evaluate('(d)=>d.open'), f'{width}: installation photo opens over artwork')
            page.keyboard.press('Tab')
            check(page.evaluate('document.activeElement.closest("#photo-dialog") !== null'), f'{width}: modal keyboard focus contained')
            page.keyboard.press('Escape')
            check(page.locator('#art-dialog').evaluate('(d)=>d.open') and page.locator('body').evaluate('(b)=>b.classList.contains("modal-open")'), f'{width}: nested photo close preserves artwork and scroll lock')
            check(page.locator('.installation-photo').evaluate('(el)=>el===document.activeElement'), f'{width}: photo opener focus restored')
            page.keyboard.press('ArrowRight')
            check('Влад' in page.locator('#dialog-title').inner_text(), f'{width}: artwork keyboard next')
            page.keyboard.press('Escape')
            for city, count in [('nn', 3), ('mur', 3), ('ekb', 2), ('yak', 3), ('sar', 3)]:
                gallery = page.locator(f'[data-gallery="{city}"]')
                check(gallery.locator('.gallery-counter').inner_text() == f'1 / {count}', f'{width}: {city} initial counter')
                gallery.locator('[data-gallery-next]').click()
                check(gallery.locator('.gallery-counter').inner_text() == f'2 / {count}', f'{width}: {city} next counter')
                gallery.locator('.city-image').focus()
                page.keyboard.press('ArrowLeft')
                check(gallery.locator('.gallery-counter').inner_text() == f'1 / {count}', f'{width}: {city} gallery keyboard')
                gallery.locator('.city-image').click()
                check(page.locator('#photo-position').inner_text() == f'1 / {count}', f'{width}: {city} photo group opens')
                page.keyboard.press('ArrowLeft')
                check(page.locator('#photo-position').inner_text() == f'{count} / {count}', f'{width}: {city} photo dialog wraps')
                page.keyboard.press('Escape')
            page.locator('[data-photo="assets/leaflet.webp"]').first.click()
            check(page.locator('#photo-zoom-level').inner_text() == 'Вписано', f'{width}: guide initial fit')
            page.locator('#photo-zoom-in').click()
            check(page.locator('#photo-viewport').evaluate('(el)=>el.scrollWidth>el.clientWidth && el.scrollHeight>el.clientHeight'), f'{width}: guide zoom scrolls in both axes')
            page.keyboard.press('+')
            check(page.locator('#photo-zoom-level').inner_text() == '200%', f'{width}: guide keyboard zoom')
            page.locator('#photo-viewport').evaluate('(el)=>el.scrollTo(200,400)')
            page.keyboard.press('0')
            check(page.locator('#photo-zoom-level').inner_text() == 'Вписано', f'{width}: guide fit reset')
            page.keyboard.press('Escape')
            page.locator('#portrait-track').focus()
            page.keyboard.press('End')
            check(page.locator('.portrait-slide').last.locator('button').evaluate('(el)=>el===document.activeElement'), f'{width}: carousel End reaches last author')
            page.keyboard.press('Home')
            check(page.locator('.portrait-slide').first.locator('button').evaluate('(el)=>el===document.activeElement'), f'{width}: carousel Home reaches first author')
            page.locator('.header nav a[href="#journey"]').click()
            page.wait_for_timeout(100)
            check(page.evaluate('Math.abs(document.querySelector("#journey").getBoundingClientRect().top) < 180'), f'{width}: main navigation')
            page.locator('[href="#city-ekb"][data-route]').click()
            page.wait_for_timeout(100)
            check(page.locator('[data-route="2"]').get_attribute('aria-current') == 'step', f'{width}: city route current state')
            check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'), f'{width}: no page horizontal overflow')
            check(page.locator('.turning-art img').evaluate('(el)=>getComputedStyle(el).animationName') == 'none', f'{width}: reduced motion')
            for link in page.locator('a[href^="#"]').all():
                href = link.get_attribute('href')
                check(page.locator(href).count() == 1, f'{width}: anchor {href}')
            check(not errors, f'{width}: no JavaScript errors: {errors}')
            check(not failed, f'{width}: no failed HTTP requests: {failed}')
            context.close()
        browser.close()
    return len(results)

def main():
    root = Path(__file__).resolve().parents[1] / 'dist'
    handler = functools.partial(QuietHandler, directory=str(root))
    with http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler) as server:
        threading.Thread(target=server.serve_forever, daemon=True).start()
        try:
            count = run_checks(f'http://127.0.0.1:{server.server_port}/')
        finally:
            server.shutdown()
    print(f'PASS: {count} browser checks at 320, 390, 768 and 1440 px')
if __name__ == '__main__':
    main()
