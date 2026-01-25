import { Router } from 'express';
import { billingService, isAdminEmail } from '../services/billingService';
import { isAuthenticated, isAdmin } from '../auth';
import { db } from '../db';
import { billingPlans } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { getStripePublishableKey, isStripeConfigured } from '../services/stripeClient';

const router = Router();

router.get('/status', async (req, res) => {
  try {
    const configured = await isStripeConfigured();
    res.json({ configured });
  } catch (error) {
    res.json({ configured: false });
  }
});

router.get('/config', isAuthenticated, async (req: any, res) => {
  try {
    const publishableKey = await getStripePublishableKey();
    res.json({ publishableKey });
  } catch (error) {
    console.error('[Billing] Failed to get Stripe config:', error);
    res.status(500).json({ message: 'Failed to get Stripe configuration' });
  }
});

router.get('/plans', async (req, res) => {
  try {
    const plans = await billingService.getAllPlans();
    res.json({ plans });
  } catch (error) {
    console.error('[Billing] Failed to get plans:', error);
    res.status(500).json({ message: 'Failed to get plans' });
  }
});

router.get('/subscription', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const subscription = await billingService.getUserSubscription(userId);
    
    if (!subscription) {
      return res.json({ subscription: null, plan: null });
    }

    const plan = await billingService.getPlanById(subscription.planId);
    res.json({ subscription, plan });
  } catch (error) {
    console.error('[Billing] Failed to get subscription:', error);
    res.status(500).json({ message: 'Failed to get subscription' });
  }
});

router.post('/checkout', isAuthenticated, async (req: any, res) => {
  try {
    const { priceId, planId } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    if (!priceId) {
      return res.status(400).json({ message: 'Price ID is required' });
    }

    const plan = await billingService.getPlanByStripePriceId(priceId);
    if (!plan) {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const successUrl = `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/pricing`;

    const checkoutUrl = await billingService.createCheckoutSession({
      userId,
      userEmail,
      priceId,
      successUrl,
      cancelUrl,
    });

    res.json({ url: checkoutUrl });
  } catch (error) {
    console.error('[Billing] Checkout error:', error);
    res.status(500).json({ message: 'Failed to create checkout session' });
  }
});

router.post('/portal', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const subscription = await billingService.getUserSubscription(userId);

    if (!subscription?.stripeCustomerId) {
      return res.status(400).json({ message: 'No active subscription found' });
    }

    const returnUrl = `${req.protocol}://${req.get('host')}/settings`;
    const portalUrl = await billingService.createCustomerPortal(
      subscription.stripeCustomerId,
      returnUrl
    );

    res.json({ url: portalUrl });
  } catch (error) {
    console.error('[Billing] Portal error:', error);
    res.status(500).json({ message: 'Failed to create customer portal' });
  }
});

router.post('/cancel', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const subscription = await billingService.getUserSubscription(userId);

    if (!subscription) {
      return res.status(400).json({ message: 'No subscription found' });
    }

    await billingService.cancelSubscription(subscription.id);

    const periodEnd = subscription.currentPeriodEnd
      ? new Date(subscription.currentPeriodEnd).toLocaleDateString('ko-KR')
      : '다음 결제일';

    res.json({
      success: true,
      message: `구독 해지가 예약되었습니다. ${periodEnd}까지 현재 플랜을 이용하실 수 있습니다.`,
    });
  } catch (error) {
    console.error('[Billing] Cancel error:', error);
    res.status(500).json({ message: 'Failed to cancel subscription' });
  }
});

router.post('/refund-request', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Reason is required' });
    }

    const subscription = await billingService.getUserSubscription(userId);
    if (!subscription) {
      return res.status(400).json({ message: 'No subscription found' });
    }

    const refundCalc = await billingService.calculateRefundAmount(subscription.id);

    const request = await billingService.createRefundRequest({
      subscriptionId: subscription.id,
      userId,
      reason,
      refundAmount: refundCalc.refundAmount,
    });

    res.json({
      success: true,
      request,
      refundInfo: refundCalc,
      message: '환불 요청이 접수되었습니다. 관리자 검토 후 처리됩니다.',
    });
  } catch (error) {
    console.error('[Billing] Refund request error:', error);
    res.status(500).json({ message: 'Failed to create refund request' });
  }
});

router.get('/admin/refunds', isAdmin, async (req, res) => {
  try {
    const refunds = await billingService.getPendingRefunds();
    res.json({ refunds });
  } catch (error) {
    console.error('[Billing] Admin refunds error:', error);
    res.status(500).json({ message: 'Failed to get refunds' });
  }
});

router.post('/admin/refunds/:id/approve', isAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;

    await billingService.approveRefund(id, adminNote);

    res.json({ success: true, message: '환불이 승인되었습니다.' });
  } catch (error) {
    console.error('[Billing] Approve refund error:', error);
    res.status(500).json({ message: 'Failed to approve refund' });
  }
});

router.post('/admin/refunds/:id/reject', isAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;

    await billingService.rejectRefund(id, adminNote);

    res.json({ success: true, message: '환불이 거부되었습니다.' });
  } catch (error) {
    console.error('[Billing] Reject refund error:', error);
    res.status(500).json({ message: 'Failed to reject refund' });
  }
});

router.get('/quota', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const subscription = await billingService.getUserSubscription(userId);
    
    let plan = null;
    if (subscription) {
      plan = await billingService.getPlanById(subscription.planId);
    }

    if (!plan) {
      plan = await billingService.getPlanById('fluent_free');
    }

    const features = plan?.features || {
      conversation_limit_month: 30,
      image_limit_month: 1,
      tts_limit_month: 50,
      model_tier: 'basic',
    };

    res.json({
      plan: plan?.name || 'Free',
      planId: plan?.id || 'fluent_free',
      limits: features,
      subscription: subscription ? {
        status: subscription.status,
        canceledAt: subscription.canceledAt,
        currentPeriodEnd: subscription.currentPeriodEnd,
      } : null,
    });
  } catch (error) {
    console.error('[Billing] Quota error:', error);
    res.status(500).json({ message: 'Failed to get quota' });
  }
});

export default router;
