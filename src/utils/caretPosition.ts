// Precision Caret Coordinate Measurement for Textarea
// Uses a synchronized hidden mirror container with identical typography, wrapping, and padding
// to compute the exact pixel (x, y) coordinates of the caret.

const STYLES_TO_COPY = [
  'boxSizing',
  'width',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderStyle',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'letterSpacing',
  'lineHeight',
  'textTransform',
  'wordSpacing',
  'textIndent',
  'tabSize',
] as const;

let mirrorDiv: HTMLDivElement | null = null;
let caretSpan: HTMLSpanElement | null = null;

function getOrCreateMirror(): { mirror: HTMLDivElement; span: HTMLSpanElement } {
  if (!mirrorDiv) {
    mirrorDiv = document.createElement('div');
    mirrorDiv.id = 'enspirewrite-caret-mirror';
    mirrorDiv.style.position = 'absolute';
    mirrorDiv.style.top = '0';
    mirrorDiv.style.left = '0';
    mirrorDiv.style.visibility = 'hidden';
    mirrorDiv.style.pointerEvents = 'none';
    mirrorDiv.style.whiteSpace = 'pre-wrap';
    mirrorDiv.style.wordWrap = 'break-word';
    mirrorDiv.style.overflowWrap = 'break-word';
    mirrorDiv.style.zIndex = '-9999';

    caretSpan = document.createElement('span');
    caretSpan.textContent = '\u200B'; // Zero-width space
    mirrorDiv.appendChild(caretSpan);

    document.body.appendChild(mirrorDiv);
  }
  return { mirror: mirrorDiv, span: caretSpan! };
}

export interface CaretCoordinates {
  // Coordinates relative to the viewport
  viewportX: number;
  viewportY: number;
  // Coordinates relative to the textarea element
  elementX: number;
  elementY: number;
  // Line height of current line in pixels
  lineHeight: number;
}

export function getCaretCoordinates(
  element: HTMLTextAreaElement,
  position: number = element.selectionStart
): CaretCoordinates {
  const { mirror, span } = getOrCreateMirror();
  const computed = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  // Copy geometry and typography styles
  for (const prop of STYLES_TO_COPY) {
    mirror.style[prop as any] = computed[prop as any];
  }

  mirror.style.width = `${element.clientWidth}px`;

  // Content before cursor
  const textBefore = element.value.substring(0, position);
  const textAfter = element.value.substring(position);

  // Clear mirror
  mirror.textContent = '';

  // Insert text before
  const textNodeBefore = document.createTextNode(textBefore);
  mirror.appendChild(textNodeBefore);

  // Insert caret marker
  span.textContent = '\u200B'; // zero width character
  mirror.appendChild(span);

  // If text ends with newline, append an extra newline so the height is calculated correctly
  if (textBefore.endsWith('\n')) {
    span.textContent = '\u00A0'; // non-breaking space on new line
  }

  // Insert text after
  const textNodeAfter = document.createTextNode(textAfter);
  mirror.appendChild(textNodeAfter);

  const spanOffsetLeft = span.offsetLeft;
  const spanOffsetTop = span.offsetTop;
  const parsedLineHeight = parseFloat(computed.lineHeight) || 32.4;

  const elementX = spanOffsetLeft;
  const elementY = spanOffsetTop;

  // Viewport position accounting for element rect and scroll offset
  const viewportX = rect.left + spanOffsetLeft - element.scrollLeft;
  const viewportY = rect.top + spanOffsetTop - element.scrollTop;

  return {
    viewportX,
    viewportY,
    elementX,
    elementY,
    lineHeight: parsedLineHeight,
  };
}
