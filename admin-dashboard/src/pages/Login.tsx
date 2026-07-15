import { useState, FormEvent } from 'react';
import Box from '@cloudscape-design/components/box';
import Container from '@cloudscape-design/components/container';
import Form from '@cloudscape-design/components/form';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Button from '@cloudscape-design/components/button';
import Alert from '@cloudscape-design/components/alert';
import SpaceBetween from '@cloudscape-design/components/space-between';
import { useAuth } from '../lib/auth';
import { ApiError } from '../lib/api';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [aEnviar, setAEnviar] = useState(false);

  async function submeter(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setAEnviar(true);
    try {
      await login(email, password);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível entrar. Tenta novamente.');
    } finally {
      setAEnviar(false);
    }
  }

  return (
    <Box padding={{ vertical: 'xxxl' }} textAlign="center">
      <div style={{ maxWidth: 380, margin: '0 auto' }}>
        <Box variant="h1" padding={{ bottom: 'l' }}>AURUM — Painel</Box>
        <Container>
          <form onSubmit={submeter}>
            <Form
              actions={
                <Button variant="primary" loading={aEnviar} formAction="submit" fullWidth>
                  Entrar
                </Button>
              }
            >
              <SpaceBetween size="m">
                {erro && <Alert type="error">{erro}</Alert>}
                <FormField label="Email">
                  <Input type="email" value={email} onChange={({ detail }) => setEmail(detail.value)} autoFocus />
                </FormField>
                <FormField label="Password">
                  <Input type="password" value={password} onChange={({ detail }) => setPassword(detail.value)} />
                </FormField>
              </SpaceBetween>
            </Form>
          </form>
        </Container>
      </div>
    </Box>
  );
}
