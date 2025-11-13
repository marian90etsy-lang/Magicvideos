// api/webhooks/stripe.js - Confirmar pagos de Stripe
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method not allowed');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Error verificando webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        
        const { data: pedidos, error: updateError } = await supabase
          .from('pedidos')
          .update({ 
            estado: 'pagado',
            progreso: 25,
            stripe_payment_id: session.payment_intent,
          })
          .eq('stripe_session_id', session.id)
          .select();

        if (updateError) {
          console.error('Error actualizando pedidos:', updateError);
        } else {
          console.log(`✅ Pedidos actualizados: ${pedidos?.length || 0}`);
        }
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(`✅ Pago exitoso: ${paymentIntent.id}`);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log(`❌ Pago fallido: ${failedPayment.id}`);
        
        await supabase
          .from('pedidos')
          .update({ estado: 'cancelado' })
          .eq('stripe_payment_id', failedPayment.id);
        break;

      default:
        console.log(`Evento no manejado: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
}
