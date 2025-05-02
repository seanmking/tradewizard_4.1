import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import { AssessmentProvider, useAssessment } from '../../context/AssessmentContext';
import Step4Container from '../../components/assessment/Step4/Step4Container';
import type { GetServerSideProps } from 'next';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

const AssessmentPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query as { id: string };
  if (!id) return <p>Loading assessment...</p>;

  return (
    <AssessmentProvider>
      <AssessmentLoader assessmentId={id} />
      <Step4Container />
    </AssessmentProvider>
  );
};

const AssessmentLoader: React.FC<{ assessmentId: string }> = ({ assessmentId }) => {
  const { dispatch } = useAssessment();

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: ass } = await supabaseClient
          .from('Assessments')
          .select('summary, fallback_reason')
          .eq('id', assessmentId)
          .single();
        dispatch({ type: 'SET_DATA', payload: { summary: ass?.summary || '', fallbackReason: ass?.fallback_reason || null } });

        const { data: products } = await supabaseClient
          .from('Products')
          .select('id, name, category, estimated_hs_code')
          .eq('assessment_id', assessmentId);
        dispatch({ type: 'SET_DATA', payload: { products: products || [] } });

        const { data: certifications } = await supabaseClient
          .from('Certifications')
          .select('name, required_for, cost, timeline, confidence')
          .eq('assessment_id', assessmentId);
        dispatch({ type: 'SET_DATA', payload: { certifications: certifications || [] } });
      } catch (error) {
        console.error('Error loading assessment data', error);
      }
    };

    // Trigger scraper + interpreter
    (async () => {
      try {
        await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: assessmentId }),
        });
        await fetch('/api/interpret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: assessmentId }),
        });
      } catch (err) {
        console.error('Error triggering pipeline', err);
      }
    })();

    // Initial load
    loadData();

    // Poll for completion
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/assessment/${assessmentId}/status`);
        const json = await res.json();
        if (json.status === 'completed') {
          clearInterval(interval);
          loadData();
        }
      } catch (e) {
        console.error('Error polling status', e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [assessmentId, dispatch]);

  return null;
};

export default AssessmentPage;
export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
}
