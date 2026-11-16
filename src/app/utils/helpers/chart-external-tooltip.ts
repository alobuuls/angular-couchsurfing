import { Chart, TooltipModel } from 'chart.js';

export interface IExternalTooltipRow {
  label?: string;
  value: string;
  country?: {
    name: string;
    flagClass: string;
  };
}

export interface IExternalTooltipData {
  title?: string;
  rows: IExternalTooltipRow[];
  country?: {
    name: string;
    flagClass: string;
  };
}

// Keep one tooltip per Chart.js instance.
const tooltips = new WeakMap<Chart, HTMLDivElement>();

/**
 * Create or update an external HTML tooltip.
 */
export const createExternalTooltip = (chart: Chart, tooltip: TooltipModel<any>, data: IExternalTooltipData): void => {
  // Hide the tooltip when the pointer leaves the chart.
  if (tooltip.opacity === 0) {
    hideExternalTooltip(chart);
    return;
  }

  const parent = chart.canvas.parentElement;

  if (!parent) return;

  let element = tooltips.get(chart);

  // Create the tooltip only once per chart.
  if (!element) {
    element = document.createElement('div');
    element.className = 'chart-external-tooltip';

    parent.appendChild(element);
    tooltips.set(chart, element);
  }

  const tooltipElement = element;

  tooltipElement.replaceChildren();

  // Tooltip title.
  if (data.title) {
    const title = document.createElement('strong');
    title.className = 'chart-tooltip-name';
    title.textContent = data.title;

    tooltipElement.appendChild(title);
  }

  // Tooltip information rows.
  data.rows.forEach(({ label, value, country }) => {
    const row = document.createElement('div');
    row.className = 'chart-tooltip-row';

    if (label) {
      const rowLabel = document.createElement('strong');
      rowLabel.textContent = `${label}: `;

      row.appendChild(rowLabel);
    }

    row.appendChild(document.createTextNode(value));

    // Country and flag beside the guest name.
    if (country) {
      const flag = document.createElement('span');
      flag.className = country.flagClass;

      const name = document.createElement('span');
      name.textContent = ` (${country.name})`;

      row.append(flag, name);
    }

    tooltipElement.appendChild(row);
  });

  // Country and flag.
  if (data.country) {
    const country = document.createElement('div');
    country.className = 'chart-tooltip-country';

    const flag = document.createElement('span');
    flag.className = data.country.flagClass;

    const name = document.createElement('span');
    name.textContent = data.country.name;

    country.append(flag, name);
    tooltipElement.appendChild(country);
  }

  // Position the tooltip to the left of the hovered point.
  tooltipElement.style.left = `${chart.canvas.offsetLeft + tooltip.caretX}px`;
  tooltipElement.style.top = `${chart.canvas.offsetTop + tooltip.caretY}px`;
  tooltipElement.style.opacity = '1';
};

/**
 * Hide an existing external tooltip.
 */
export const hideExternalTooltip = (chart: Chart): void => {
  const element = tooltips.get(chart);
  if (element) element.style.opacity = '0';
};

/**
 * Remove the external tooltip when the chart is destroyed.
 */
export const destroyExternalTooltip = (chart: Chart): void => {
  const element = tooltips.get(chart);

  if (element) {
    element.remove();
    tooltips.delete(chart);
  }
};
