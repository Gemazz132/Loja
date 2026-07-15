import { useEffect, useState } from 'react';
import ContentLayout from '@cloudscape-design/components/content-layout';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import Form from '@cloudscape-design/components/form';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Alert from '@cloudscape-design/components/alert';
import { settingsApi, SiteConfig } from '../lib/api';

export default function Settings() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [portes, setPortes] = useState({ portes_valor: '', portes_gratis_acima: '' });
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    settingsApi.obter().then(setConfig);
    settingsApi.portes().then((p) => setPortes({ portes_valor: String(p.portes_valor), portes_gratis_acima: String(p.portes_gratis_acima) }));
  }, []);

  async function guardarTudo() {
    if (config) await settingsApi.guardar(config);
    await settingsApi.guardarPortes(portes);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
  }

  return (
    <ContentLayout header={<Header variant="h1">Definições</Header>}>
      <SpaceBetween size="l">
        {guardado && <Alert type="success">Definições guardadas.</Alert>}

        <Container header={<Header variant="h2">Identidade do site</Header>}>
          {config && (
            <SpaceBetween size="m">
              <FormField label="Título do site"><Input value={config.titulo_site} onChange={({ detail }) => setConfig({ ...config, titulo_site: detail.value })} /></FormField>
              <FormField label="Idioma"><Input value={config.idioma} onChange={({ detail }) => setConfig({ ...config, idioma: detail.value })} /></FormField>
              <FormField label="URL do logótipo"><Input value={config.logotipo_url} onChange={({ detail }) => setConfig({ ...config, logotipo_url: detail.value })} /></FormField>
              <SpaceBetween direction="horizontal" size="m">
                <FormField label="Cor primária (dourado)">
                  <input type="color" value={config.cor_primaria} onChange={(e) => setConfig({ ...config, cor_primaria: e.target.value })} style={{ width: 60, height: 32 }} />
                </FormField>
                <FormField label="Cor de fundo (preto/charcoal)">
                  <input type="color" value={config.cor_fundo} onChange={(e) => setConfig({ ...config, cor_fundo: e.target.value })} style={{ width: 60, height: 32 }} />
                </FormField>
              </SpaceBetween>
            </SpaceBetween>
          )}
        </Container>

        <Container header={<Header variant="h2">Portes de envio</Header>}>
          <SpaceBetween size="m">
            <FormField label="Custo dos portes (€)">
              <Input type="number" value={portes.portes_valor} onChange={({ detail }) => setPortes({ ...portes, portes_valor: detail.value })} />
            </FormField>
            <FormField label="Portes grátis a partir de (€)">
              <Input type="number" value={portes.portes_gratis_acima} onChange={({ detail }) => setPortes({ ...portes, portes_gratis_acima: detail.value })} />
            </FormField>
          </SpaceBetween>
        </Container>

        <Button variant="primary" onClick={guardarTudo}>Guardar todas as definições</Button>
      </SpaceBetween>
    </ContentLayout>
  );
}
