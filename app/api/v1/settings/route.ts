import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function GET() {
  try {
    let settings = await prisma.storeSettings.findUnique({
      where: { id: 'default' }
    });

    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: {
          id: 'default',
          storeName: 'RIO COLLECTION',
          whatsappNumber: '628123456789',
          bankName: 'BCA',
          bankAccountNumber: '1234567890',
          bankAccountOwner: 'RIO COLLECTION',
          flatShippingRate: 15000
        }
      });
    }

    return NextResponse.json({
      code: 200,
      status: 'success',
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to fetch store settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      storeName,
      whatsappNumber,
      bankName,
      bankAccountNumber,
      bankAccountOwner,
      flatShippingRate,
      instagramUrl,
      tiktokUrl,
      facebookUrl,
      pinterestUrl,
      xTwitterUrl,
      heroTitle,
      heroSubtitle,
      heroLayout,
      heroLeftImage,
      heroCenterImage,
      heroRightImage,
      heroCtaText,
      heroCtaLink,
      homeFeaturedTitle,
      homeViewAllLabel,
      homeManifestoTitle,
      homeManifestoText,
      homeManifestoImage,
      homeBannerText,
      homeBannerButton,
      archiveHeaderSub,
      archiveQuoteTitle,
      archiveQuoteText,
      aboutHeroImage,
      aboutHeading,
      aboutParagraph1,
      aboutParagraph2,
      aboutValuesTitle,
      aboutValues,
      aboutQuote,
      aboutQuoteText,
      aboutStudioImage,
      contactEmail,
      waTemplatePending,
      waTemplatePayment,
      waTemplateShipping,
      waTemplateRemind,
      enabledCouriers,
      originCityId,
      originCityName,
      originProvinceName
    } = body;

    const updatedSettings = await prisma.storeSettings.upsert({
      where: { id: 'default' },
      update: {
        ...(storeName && { storeName }),
        ...(whatsappNumber && { whatsappNumber }),
        ...(bankName && { bankName }),
        ...(bankAccountNumber && { bankAccountNumber }),
        ...(bankAccountOwner && { bankAccountOwner }),
        ...(flatShippingRate !== undefined && { flatShippingRate: Number(flatShippingRate) }),
        ...(instagramUrl !== undefined && { instagramUrl }),
        ...(tiktokUrl !== undefined && { tiktokUrl }),
        ...(facebookUrl !== undefined && { facebookUrl }),
        ...(pinterestUrl !== undefined && { pinterestUrl }),
        ...(xTwitterUrl !== undefined && { xTwitterUrl }),
        ...(heroTitle !== undefined && { heroTitle }),
        ...(heroSubtitle !== undefined && { heroSubtitle }),
        ...(heroLayout !== undefined && { heroLayout }),
        ...(heroLeftImage !== undefined && { heroLeftImage }),
        ...(heroCenterImage !== undefined && { heroCenterImage }),
        ...(heroRightImage !== undefined && { heroRightImage }),
        ...(heroCtaText !== undefined && { heroCtaText }),
        ...(heroCtaLink !== undefined && { heroCtaLink }),
        ...(homeFeaturedTitle !== undefined && { homeFeaturedTitle }),
        ...(homeViewAllLabel !== undefined && { homeViewAllLabel }),
        ...(homeManifestoTitle !== undefined && { homeManifestoTitle }),
        ...(homeManifestoText !== undefined && { homeManifestoText }),
        ...(homeManifestoImage !== undefined && { homeManifestoImage }),
        ...(homeBannerText !== undefined && { homeBannerText }),
        ...(homeBannerButton !== undefined && { homeBannerButton }),
        ...(archiveHeaderSub !== undefined && { archiveHeaderSub }),
        ...(archiveQuoteTitle !== undefined && { archiveQuoteTitle }),
        ...(archiveQuoteText !== undefined && { archiveQuoteText }),
        ...(aboutHeroImage !== undefined && { aboutHeroImage }),
        ...(aboutHeading !== undefined && { aboutHeading }),
        ...(aboutParagraph1 !== undefined && { aboutParagraph1 }),
        ...(aboutParagraph2 !== undefined && { aboutParagraph2 }),
        ...(aboutValuesTitle !== undefined && { aboutValuesTitle }),
        ...(aboutValues !== undefined && { aboutValues }),
        ...(aboutQuote !== undefined && { aboutQuote }),
        ...(aboutQuoteText !== undefined && { aboutQuoteText }),
        ...(aboutStudioImage !== undefined && { aboutStudioImage }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(waTemplatePending !== undefined && { waTemplatePending }),
        ...(waTemplatePayment !== undefined && { waTemplatePayment }),
        ...(waTemplateShipping !== undefined && { waTemplateShipping }),
        ...(waTemplateRemind !== undefined && { waTemplateRemind }),
        ...(enabledCouriers !== undefined && { enabledCouriers }),
        ...(originCityId !== undefined && { originCityId }),
        ...(originCityName !== undefined && { originCityName }),
        ...(originProvinceName !== undefined && { originProvinceName })
      },
      create: {
        id: 'default',
        storeName: storeName || 'RIO COLLECTION',
        whatsappNumber: whatsappNumber || '628123456789',
        bankName: bankName || 'BCA',
        bankAccountNumber: bankAccountNumber || '1234567890',
        bankAccountOwner: bankAccountOwner || 'RIO COLLECTION',
        flatShippingRate: Number(flatShippingRate || 15000),
        instagramUrl,
        tiktokUrl,
        facebookUrl,
        pinterestUrl,
        xTwitterUrl,
        heroTitle: heroTitle || 'EDITION 001',
        heroSubtitle: heroSubtitle || 'ARCHIVAL COTTON SILHOUETTE',
        heroLayout: heroLayout || '2-grid',
        heroLeftImage:
          heroLeftImage ||
          'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200&auto=format&fit=crop&q=80',
        heroCenterImage: heroCenterImage || '',
        heroRightImage:
          heroRightImage ||
          'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&auto=format&fit=crop&q=80',
        heroCtaText: heroCtaText || 'Eksplor Koleksi Terkini',
        heroCtaLink: heroCtaLink || '/catalogue',
        homeFeaturedTitle,
        homeViewAllLabel,
        homeManifestoTitle,
        homeManifestoText,
        homeManifestoImage,
        homeBannerText,
        homeBannerButton,
        archiveHeaderSub,
        archiveQuoteTitle,
        archiveQuoteText,
        aboutHeroImage,
        aboutHeading,
        aboutParagraph1,
        aboutParagraph2,
        aboutValuesTitle,
        aboutValues,
        aboutQuote,
        aboutQuoteText,
        aboutStudioImage,
        contactEmail,
        waTemplatePending,
        waTemplatePayment,
        waTemplateShipping,
        waTemplateRemind,
        enabledCouriers: enabledCouriers || 'jne,pos,tiki,sicepat,jnt',
        originCityId: originCityId || '153',
        originCityName: originCityName || 'Kota Bandung',
        originProvinceName: originProvinceName || 'Jawa Barat'
      }
    });

    revalidatePath('/(catalogue)', 'layout');
    return NextResponse.json({ code: 200, status: 'success', data: updatedSettings });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { code: 500, status: 'error', message: 'Failed to update store settings' },
      { status: 500 }
    );
  }
}
