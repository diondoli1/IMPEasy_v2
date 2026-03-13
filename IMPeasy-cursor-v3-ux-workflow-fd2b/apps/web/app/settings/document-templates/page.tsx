'use client';

import React, { useEffect, useState } from 'react';

import { listDocumentTemplates, updateDocumentTemplate } from '../../../lib/api';
import type { DocumentTemplateSetting } from '../../../types/settings';
import { SettingsTemplate } from '../../../components/ui/page-templates';
import { Badge, BadgeRow, Button, Notice, Panel } from '../../../components/ui/primitives';

function toTemplateLabel(templateType: string): string {
  switch (templateType) {
    case 'quote':
      return 'Quote template';
    case 'sales_order':
      return 'Sales order template';
    case 'shipment':
      return 'Shipment template';
    case 'invoice':
      return 'Invoice template';
    default:
      return templateType;
  }
}

export default function DocumentTemplatesPage(): JSX.Element {
  const [templates, setTemplates] = useState<DocumentTemplateSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingTemplateType, setSavingTemplateType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      try {
        const loadedTemplates = await listDocumentTemplates();
        if (!isCancelled) {
          setTemplates(loadedTemplates);
        }
      } catch {
        if (!isCancelled) {
          setError('Unable to load document templates.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, []);

  const updateTemplateDraft = (
    templateId: number,
    changes: Partial<DocumentTemplateSetting>,
  ): void => {
    setTemplates((currentTemplates) =>
      currentTemplates.map((template) =>
        template.id === templateId ? { ...template, ...changes } : template,
      ),
    );
  };

  const saveTemplate = async (template: DocumentTemplateSetting): Promise<void> => {
    const outputFormat = template.outputFormat.trim();
    if (!outputFormat) {
      setError('Output format is required.');
      return;
    }

    setError(null);
    setSavedMessage(null);
    setSavingTemplateType(template.templateType);

    try {
      const updatedTemplate = await updateDocumentTemplate(template.templateType, {
        outputFormat,
        headerFieldsEnabled: template.headerFieldsEnabled,
        footerNotesEnabled: template.footerNotesEnabled,
        notes: template.notes,
      });

      setTemplates((currentTemplates) =>
        currentTemplates.map((candidate) =>
          candidate.id === updatedTemplate.id ? updatedTemplate : candidate,
        ),
      );
      setSavedMessage(`${toTemplateLabel(template.templateType)} saved.`);
    } catch {
      setError(`Unable to save ${toTemplateLabel(template.templateType).toLowerCase()}.`);
    } finally {
      setSavingTemplateType(null);
    }
  };

  return (
    <SettingsTemplate
      eyebrow="Settings"
      title="Document templates"
      description="Basic template configuration only. Visual editors and conditional template engines stay out of MVP scope."
      form={
        <div className="page-stack">
          {error ? (
            <Notice title="Unable to save" tone="warning">
              {error}
            </Notice>
          ) : null}
          {savedMessage ? <Notice title="Saved">{savedMessage}</Notice> : null}
          {isLoading ? (
            <p>Loading document templates...</p>
          ) : (
            templates.map((template) => (
              <Panel
                key={template.id}
                title={toTemplateLabel(template.templateType)}
                description={`Template type: ${template.templateType}`}
                compactHeader
                muted
              >
                <div className="page-stack">
                  <BadgeRow>
                    <Badge tone="info">{template.outputFormat.toUpperCase()} output</Badge>
                    <Badge tone={template.headerFieldsEnabled ? 'success' : 'warning'}>
                      Header {template.headerFieldsEnabled ? 'enabled' : 'disabled'}
                    </Badge>
                    <Badge tone={template.footerNotesEnabled ? 'success' : 'warning'}>
                      Footer notes {template.footerNotesEnabled ? 'enabled' : 'disabled'}
                    </Badge>
                  </BadgeRow>

                  <div className="form-grid form-grid--two">
                    <label className="field">
                      <span className="field__label">Output format</span>
                      <input
                        className="control mono"
                        value={template.outputFormat}
                        onChange={(event) =>
                          updateTemplateDraft(template.id, {
                            outputFormat: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="field">
                      <span className="field__label">Template notes</span>
                      <textarea
                        className="control"
                        value={template.notes ?? ''}
                        onChange={(event) =>
                          updateTemplateDraft(template.id, {
                            notes: event.target.value.trim().length > 0 ? event.target.value : null,
                          })
                        }
                      />
                    </label>
                    <label className="link-list__item">
                      <span className="muted-copy">Show header fields</span>
                      <input
                        type="checkbox"
                        checked={template.headerFieldsEnabled}
                        onChange={(event) =>
                          updateTemplateDraft(template.id, {
                            headerFieldsEnabled: event.target.checked,
                          })
                        }
                      />
                    </label>
                    <label className="link-list__item">
                      <span className="muted-copy">Show footer notes</span>
                      <input
                        type="checkbox"
                        checked={template.footerNotesEnabled}
                        onChange={(event) =>
                          updateTemplateDraft(template.id, {
                            footerNotesEnabled: event.target.checked,
                          })
                        }
                      />
                    </label>
                  </div>

                  <div className="page-shell__actions">
                    <Button
                      tone="primary"
                      onClick={() => void saveTemplate(template)}
                      disabled={savingTemplateType === template.templateType}
                    >
                      {savingTemplateType === template.templateType ? 'Saving...' : 'Save template'}
                    </Button>
                  </div>
                </div>
              </Panel>
            ))
          )}
        </div>
      }
      aside={
        <>
          <Notice title="Out of scope">
            No WYSIWYG editor, conditional sections, or branding workflows are added in this MVP slice.
          </Notice>
          <Panel title="Checkpoint focus" description="Card rhythm and badge treatment should match the other settings tabs.">
            <p className="muted-copy">
              Compare panel padding, checkbox layout, and save-action placement against company and numbering pages.
            </p>
          </Panel>
        </>
      }
    />
  );
}
