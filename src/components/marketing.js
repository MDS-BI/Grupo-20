import { renderDashboardHtml } from './dashboard.js';
import { escapeHtml } from '../utils/sanitize.js';
import { MARKETING_STAGES, MARKETING_STAGE_LABELS } from '../utils/marketing-stages.js';
import { computeMarketingPerformance } from '../utils/marketing-performance.js';
import { renderMarketingTeamHtml } from './marketing-team.js';
import { renderMarketingSocialHtml } from './marketing-social.js';
import { renderMarketingChatHtml } from './marketing-chat.js';
import { MESSAGES } from '../utils/messages.js';
import { can } from '../auth/permissions.js';

const SECTIONS = [
  { key: 'team', label: 'Equipos de ventas y logros' },
  { key: 'campaigns', label: 'Campañas' },
  { key: 'performance', label: 'Rendimiento de campañas' },
  { key: 'chat', label: 'Dudas y consultas' },
  { key: 'social', label: 'Redes sociales' },
];

function optionsFromCampaigns(campaigns, selected) {
  return campaigns
    .map(
      (campaign) =>
        `<option value="${escapeHtml(campaign.id)}" ${campaign.id === selected ? 'selected' : ''}>${escapeHtml(campaign.name)}</option>`
    )
    .join('');
}

function stageOptions(selected) {
  return MARKETING_STAGES.map(
    (stage) =>
      `<option value="${stage}" ${stage === selected ? 'selected' : ''}>${escapeHtml(MARKETING_STAGE_LABELS[stage])}</option>`
  ).join('');
}

function renderCampaignsHtml({
  marketingConfig = {},
  documents = [],
  campaignForm = {},
  editingCampaignId = null,
  readOnly = false,
} = {}) {
  const campaigns = marketingConfig.campaigns || [];
  const history = documents
    .filter((doc) => doc.campaignId)
    .slice()
    .sort((a, b) =>
      String(b.createdAt || b.startDate || '').localeCompare(
        String(a.createdAt || a.startDate || '')
      )
    );
  return `
    <section class="marketing-campaigns marketing-panel">
      <h2>Campañas</h2>
      <form id="campaign-form" class="marketing-form" novalidate>
        <label>Nombre<input name="name" value="${escapeHtml(campaignForm.name || '')}" required /></label>
        <label>Etapa objetivo<select name="stage">${stageOptions(campaignForm.stage || MARKETING_STAGES[0])}</select></label>
        <label>Inicio<input type="date" name="startDate" value="${escapeHtml(campaignForm.startDate || '')}" required /></label>
        <label>Fin<input type="date" name="endDate" value="${escapeHtml(campaignForm.endDate || '')}" required /></label>
        <label>Acción interna
          <select name="action">
            ${['create_document', 'assign_executive', 'update_stage']
              .map(
                (action) =>
                  `<option value="${action}" ${campaignForm.action === action || (!campaignForm.action && action === 'create_document') ? 'selected' : ''}>${action === 'create_document' ? 'Crear documento de seguimiento' : action === 'assign_executive' ? 'Asignar ejecutivo' : 'Actualizar estado comercial'}</option>`
              )
              .join('')}
          </select>
        </label>
        <label>Ejecutivo<input name="executive" value="${escapeHtml(campaignForm.executive || '')}" /></label>
        <label>Estado objetivo<input name="targetStage" value="${escapeHtml(campaignForm.targetStage || '')}" /></label>
        <label>Notas<textarea name="notes">${escapeHtml(campaignForm.notes || '')}</textarea></label>
        <button type="submit">${editingCampaignId ? 'Guardar campaña' : 'Crear campaña'}</button>
        ${editingCampaignId ? '<button type="button" data-action="cancel-campaign-edit">Cancelar</button>' : ''}
      </form>
      ${
        campaigns.length
          ? `<ul class="campaign-list">${campaigns
              .map(
                (campaign) => `
              <li class="list-item">
                <div class="list-item-main">
                  <span class="list-item-title">${escapeHtml(campaign.name)}</span>
                  <span>${escapeHtml(campaign.stage)} · ${escapeHtml(campaign.startDate || '')} a ${escapeHtml(campaign.endDate || '')} · ${escapeHtml(campaign.status)}</span>
                </div>
                <div class="list-item-actions">
                  <button type="button" data-action="edit-campaign" data-id="${escapeHtml(campaign.id)}" ${readOnly ? 'disabled' : ''}>Editar</button>
                  <button type="button" data-action="stop-campaign" data-id="${escapeHtml(campaign.id)}" ${readOnly || campaign.status === 'detenida' ? 'disabled' : ''}>Detener</button>
                </div>
              </li>`
              )
              .join('')}</ul>`
          : '<p class="empty-state">Aún no hay campañas programadas.</p>'
      }
      <h3>Historial de ejecuciones</h3>
      ${
        history.length
          ? `<ul class="campaign-history">${history
              .map(
                (doc) => `
              <li>${escapeHtml(doc.createdAt || doc.startDate || '')} · ${escapeHtml(doc.notes || 'Acción registrada')} · ${escapeHtml(doc.campaignId || '')}</li>`
              )
              .join('')}</ul>`
          : '<p class="empty-state">Todavía no hay ejecuciones de campaña.</p>'
      }
    </section>`;
}

function renderPerformanceHtml({
  marketingConfig = {},
  entities = [],
  documents = [],
  selectedCampaignId = 'all',
} = {}) {
  const campaigns = marketingConfig.campaigns || [];
  const performance = computeMarketingPerformance({
    entities,
    documents,
    campaigns,
    campaignId: selectedCampaignId,
  });
  return `
    <section class="marketing-performance marketing-panel">
      <h2>Rendimiento de campañas</h2>
      <label>Campaña
        <select id="performance-campaign">
          <option value="all" ${selectedCampaignId === 'all' ? 'selected' : ''}>Todas las campañas</option>
          <option value="none" ${selectedCampaignId === 'none' ? 'selected' : ''}>Sin campaña</option>
          ${optionsFromCampaigns(campaigns, selectedCampaignId)}
        </select>
      </label>
      ${performance.hasData ? '' : `<p class="empty-state">${MESSAGES.noCampaignRecords}</p>`}
      <div class="summary-cards performance-cards">
        <div class="stat-card"><span class="stat-value">${performance.totalProspects}</span><span class="stat-label">Prospectos capturados</span></div>
        <div class="stat-card"><span class="stat-value">${performance.conversionRate.toFixed(1)}%</span><span class="stat-label">Tasa de conversión</span></div>
        <div class="stat-card"><span class="stat-value">${performance.interactions}</span><span class="stat-label">Interacciones registradas</span></div>
        <div class="stat-card"><span class="stat-value">${performance.answeredQueries}</span><span class="stat-label">Consultas respondidas</span></div>
        <div class="stat-card"><span class="stat-value">${performance.wonSales}</span><span class="stat-label">Ventas ganadas</span></div>
      </div>
      <ul class="stage-conversions">
        ${performance.stageConversions
          .map((step) => `<li>${escapeHtml(step.label)}: ${step.count}</li>`)
          .join('')}
      </ul>
    </section>`;
}

export function renderMarketingHtml(config, stats, options = {}) {
  const {
    entities = [],
    documents = [],
    marketingConfig = {},
    section = 'team',
    team = {},
    social = {},
    chat = {},
    campaigns = {},
    selectedCampaignId = 'all',
    role = 'visitor',
    authEnabled = false,
  } = options;
  const hasMarketingAccess =
    !authEnabled ||
    can(role, 'marketing:view') ||
    can(role, 'marketing:manage') ||
    can(role, 'team:manage');
  if (!hasMarketingAccess) {
    return `<section class="marketing-view marketing-panel" role="alert"><p class="empty-state">${MESSAGES.accessDenied}</p></section>`;
  }
  const dashboard = renderDashboardHtml(config, stats, {
    title: 'Marketing',
    sectionClass: 'marketing-view',
    showQuickActions: false,
  });
  const navigation = `
    <div class="marketing-sections" role="tablist" aria-label="Secciones de Marketing">
      ${SECTIONS.map(
        (item) =>
          `<button type="button" role="tab" data-action="marketing-section" data-section="${item.key}" aria-selected="${section === item.key}" class="${section === item.key ? 'active' : ''}">${escapeHtml(item.label)}</button>`
      ).join('')}
    </div>
    <div class="marketing-section-panel">${
      section === 'team'
        ? renderMarketingTeamHtml({ ...team, teams: marketingConfig.salesTeams || [] })
        : section === 'social'
          ? renderMarketingSocialHtml({
              ...social,
              interactions: documents.filter((doc) => doc.canal === 'redes'),
              entities,
              campaigns: marketingConfig.campaigns || [],
            })
          : section === 'chat'
            ? renderMarketingChatHtml({
                ...chat,
                messages: documents.filter((doc) => doc.canal === 'chat'),
                faq: marketingConfig.faq || [],
                entities,
                campaigns: marketingConfig.campaigns || [],
                role,
                authEnabled,
              })
            : section === 'campaigns'
              ? renderCampaignsHtml({ marketingConfig, documents, ...campaigns })
              : renderPerformanceHtml({ marketingConfig, entities, documents, selectedCampaignId })
    }</div>`;
  return dashboard.replace('</section>', `</section>${navigation}`);
}
