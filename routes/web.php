<?php

use App\Http\Controllers\AccountReceivableController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\ApiCredentialController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\BranchPhotoController;
use App\Http\Controllers\BranchScoreboardController;
use App\Http\Controllers\CashierSessionController;
use App\Http\Controllers\CheckInController;
use App\Http\Controllers\CoachController;
use App\Http\Controllers\CourtController;
use App\Http\Controllers\CourtDiscoveryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DemoPipelineController;
use App\Http\Controllers\DemoRequestController;
use App\Http\Controllers\DuplicateIdentityController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\GlobalSearchController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\LiveCourtController;
use App\Http\Controllers\MaintenanceController;
use App\Http\Controllers\MatchController;
use App\Http\Controllers\MembershipController;
use App\Http\Controllers\NotificationCenterController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\OpenPlayController;
use App\Http\Controllers\OperationsController;
use App\Http\Controllers\OrganizationSettingsController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PlatformAuditController;
use App\Http\Controllers\PlayerBookingController;
use App\Http\Controllers\PlayerController;
use App\Http\Controllers\PlayerIdentityController;
use App\Http\Controllers\PlayerPortalController;
use App\Http\Controllers\PlayerProfileController;
use App\Http\Controllers\PlayerWalletController;
use App\Http\Controllers\POSController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PublicClubController;
use App\Http\Controllers\PublicLiveMatchController;
use App\Http\Controllers\PublicOpenPlayBoardController;
use App\Http\Controllers\PublicOpenPlayController;
use App\Http\Controllers\PublicOpenPlayJoinController;
use App\Http\Controllers\PublicRankingController;
use App\Http\Controllers\PublicTournamentController;
use App\Http\Controllers\RankingController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\SchedulerController;
use App\Http\Controllers\ScoreController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\StockTransferController;
use App\Http\Controllers\SubscriptionPlanController;
use App\Http\Controllers\SupportTicketController;
use App\Http\Controllers\TeamRoleController;
use App\Http\Controllers\TenantSubscriptionController;
use App\Http\Controllers\TournamentController;
use App\Http\Controllers\WorkspaceController;
use Illuminate\Support\Facades\Route;

Route::get('/', LandingController::class)->name('home');
Route::get('privacy-policy', [LandingController::class, 'privacy'])->name('privacy');
Route::get('terms-of-service', [LandingController::class, 'terms'])->name('terms');
Route::get('request-demo', [DemoRequestController::class, 'create'])->name('demo.create');
Route::post('request-demo', [DemoRequestController::class, 'store'])->name('demo.store');
Route::get('request-demo/confirmation/{demoRequest}', [DemoRequestController::class, 'confirmation'])->name('demo.requested');
Route::get('display/live', [LiveCourtController::class, 'display'])->name('display.live');
/*
 * One branch's courtside screen. Public because it runs on a TV in the venue
 * that nobody signs into; the club can still put it behind a token in settings,
 * and this honours the same one as the club-wide display.
 */
Route::get('display/scoreboard/{branch}', BranchScoreboardController::class)->name('display.scoreboard');
Route::get('live/matches/{match}', [PublicLiveMatchController::class, 'show'])->name('matches.public.show');
Route::get('player-identities/{courtprimePlayerId}', [PlayerIdentityController::class, 'publicProfile'])->name('player-identities.public');
Route::get('player-qr/{courtprimePlayerId}', [PlayerIdentityController::class, 'qrProfile'])->middleware('signed')->name('player-identities.qr');
Route::get('find-courts', CourtDiscoveryController::class)->name('courts.discovery');
Route::get('find-open-play', PublicOpenPlayController::class)->name('open-play.discovery');
/* Walk-ins join with the club's code and a name, no account. Throttled because
   it creates player records from unauthenticated input. */
Route::post('open-play/open', [PublicOpenPlayJoinController::class, 'store'])
    ->middleware('throttle:10,1')
    ->name('open-play.board.open');

/*
 * The players' board. Owners create the session; the people on the court run
 * it. The session code is the access boundary and every action re-checks that
 * the match belongs to it, so none of this needs a staff account.
 */
/* The gate. Nothing about a session is revealed until both halves are right. */
Route::get('open-play/board', [PublicOpenPlayBoardController::class, 'gate'])->name('open-play.gate');
Route::post('open-play/board', [PublicOpenPlayBoardController::class, 'enter'])
    ->middleware('throttle:10,1')
    ->name('open-play.enter');

Route::prefix('open-play/{code}')->middleware('throttle:120,1')->group(function () {
    Route::get('board', [PublicOpenPlayBoardController::class, 'show'])->name('open-play.board.public');
    Route::get('players/search', [PublicOpenPlayBoardController::class, 'searchPlayers'])->name('open-play.board.players.search');
    Route::post('players', [PublicOpenPlayBoardController::class, 'addPlayer'])->name('open-play.board.players');
    Route::delete('players/{player}', [PublicOpenPlayBoardController::class, 'removePlayer'])->name('open-play.board.players.remove');
    Route::post('settings', [PublicOpenPlayBoardController::class, 'settings'])->name('open-play.board.settings');
    Route::post('start', [PublicOpenPlayBoardController::class, 'start'])->name('open-play.board.start');
    Route::post('release', [PublicOpenPlayBoardController::class, 'release'])->name('open-play.board.release');
    Route::post('matches/{match}/score', [PublicOpenPlayBoardController::class, 'score'])->name('open-play.board.score');
    Route::post('matches/{match}/teams', [PublicOpenPlayBoardController::class, 'arrangeTeams'])->name('open-play.board.teams');
    Route::post('matches/{match}/undo', [PublicOpenPlayBoardController::class, 'undo'])->name('open-play.board.undo');
    Route::post('matches/{match}/finish', [PublicOpenPlayBoardController::class, 'complete'])->name('open-play.board.finish');
});
Route::get('find-tournaments', [PublicTournamentController::class, 'index'])->name('tournaments.discovery');
Route::post('find-tournaments/{tournamentId}/register', [PublicTournamentController::class, 'register'])->name('tournaments.discovery.register');
Route::get('leaderboards', PublicRankingController::class)->name('rankings.public');
Route::get('clubs/{slug}', [PublicClubController::class, 'show'])->name('clubs.public.show');

/*
 * Booking is public to look at and private to do. Somebody deciding whether to
 * come down on Saturday should see what is free without an account; taking the
 * court is what needs one, and the POST below still requires it.
 */
Route::get('me/book', [PlayerBookingController::class, 'index'])->name('me.book');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('me', PlayerPortalController::class)->name('me');
    Route::get('me/profile', [PlayerProfileController::class, 'edit'])->name('me.profile');
    Route::post('me/profile', [PlayerProfileController::class, 'update'])->name('me.profile.update');
    Route::post('me/book', [PlayerBookingController::class, 'store'])->name('me.book.store');
    Route::get('me/wallet', PlayerWalletController::class)->name('me.wallet');
    /* Players join an open play session with the code the club shared. */
    Route::get('demo-pipeline', [DemoPipelineController::class, 'index'])->name('demo-pipeline.index');
    Route::post('demo-pipeline/{demoRequest}', [DemoPipelineController::class, 'update'])->name('demo-pipeline.update');
    Route::post('demo-pipeline/{demoRequest}/convert', [DemoPipelineController::class, 'convert'])->name('demo-pipeline.convert');
    Route::get('subscription-plans', [SubscriptionPlanController::class, 'index'])->name('subscription-plans.index');
    Route::post('subscription-plans', [SubscriptionPlanController::class, 'store'])->name('subscription-plans.store');
    Route::post('subscription-plans/{subscriptionPlan}/features', [SubscriptionPlanController::class, 'storeFeature'])->name('subscription-plans.features.store');
    Route::get('tenant-subscriptions', [TenantSubscriptionController::class, 'index'])->name('tenant-subscriptions.index');
    Route::post('tenant-subscriptions/{organization}', [TenantSubscriptionController::class, 'update'])->name('tenant-subscriptions.update');
    Route::post('tenant-subscriptions/{organization}/invoices', [TenantSubscriptionController::class, 'invoice'])->name('tenant-subscriptions.invoices.store');
    Route::post('tenant-subscriptions/{organization}/payments', [TenantSubscriptionController::class, 'payment'])->name('tenant-subscriptions.payments.store');
    Route::get('duplicate-identities', DuplicateIdentityController::class)->name('duplicate-identities.index');
    Route::get('platform-audit', PlatformAuditController::class)->name('platform-audit.index');
    Route::post('workspace', [WorkspaceController::class, 'update'])->name('workspace.update');
    Route::get('global-search', GlobalSearchController::class)->middleware('throttle:60,1')->name('global-search');
    Route::get('team-roles', [TeamRoleController::class, 'index'])->name('team-roles.index');
    Route::post('team-roles', [TeamRoleController::class, 'store'])->name('team-roles.store');
    Route::delete('team-roles/{organizationUserRole}', [TeamRoleController::class, 'destroy'])->name('team-roles.destroy');
    Route::get('organization-settings', [OrganizationSettingsController::class, 'show'])->name('organization-settings.show');
    Route::post('organization-settings', [OrganizationSettingsController::class, 'update'])->name('organization-settings.update');
    Route::get('api-credentials', [ApiCredentialController::class, 'index'])->name('api-credentials.index');
    Route::post('api-credentials', [ApiCredentialController::class, 'store'])->name('api-credentials.store');
    Route::post('api-credentials/{apiCredential}/revoke', [ApiCredentialController::class, 'revoke'])->name('api-credentials.revoke');
    Route::get('onboarding', [OnboardingController::class, 'show'])->name('onboarding.show');
    Route::post('onboarding', [OnboardingController::class, 'update'])->name('onboarding.update');
    Route::get('announcements', [AnnouncementController::class, 'index'])->name('announcements.index');
    Route::post('announcements', [AnnouncementController::class, 'store'])->name('announcements.store');
    Route::get('maintenance', [MaintenanceController::class, 'index'])->name('maintenance.index');
    Route::post('maintenance', [MaintenanceController::class, 'store'])->name('maintenance.store');
    Route::post('maintenance/{maintenanceWorkOrder}', [MaintenanceController::class, 'update'])->name('maintenance.update');
    Route::get('operations', OperationsController::class)->name('operations');
    Route::get('branches', [BranchController::class, 'index'])->name('branches.index');
    Route::post('branches', [BranchController::class, 'store'])->name('branches.store');
    /* Gallery management, scoped to a branch the club can already manage. */
    Route::post('branches/{branch}/photos', [BranchPhotoController::class, 'store'])->name('branches.photos.store');
    Route::post('branches/{branch}/photos/{photo}', [BranchPhotoController::class, 'update'])->name('branches.photos.update');
    Route::delete('branches/{branch}/photos/{photo}', [BranchPhotoController::class, 'destroy'])->name('branches.photos.destroy');
    Route::get('courts', [CourtController::class, 'index'])->name('courts.index');
    Route::post('courts', [CourtController::class, 'store'])->name('courts.store');
    Route::get('players', [PlayerController::class, 'index'])->name('players.index');
    Route::post('players', [PlayerController::class, 'store'])->name('players.store');
    Route::get('players/{organizationPlayer}', [PlayerIdentityController::class, 'show'])->name('players.identity.show');
    Route::post('players/{organizationPlayer}/claim', [PlayerIdentityController::class, 'claim'])->name('players.identity.claim');
    Route::post('players/{organizationPlayer}/privacy', [PlayerIdentityController::class, 'updatePrivacy'])->name('players.identity.privacy');
    Route::post('players/{organizationPlayer}/qr/rotate', [PlayerIdentityController::class, 'rotateQr'])->name('players.identity.qr.rotate');
    Route::post('players/{organizationPlayer}/waivers', [PlayerIdentityController::class, 'storeWaiver'])->name('players.identity.waivers.store');
    Route::post('players/{organizationPlayer}/crm-notes', [PlayerIdentityController::class, 'storeCrmNote'])->name('players.identity.crm-notes.store');
    Route::post('players/{organizationPlayer}/achievements', [PlayerIdentityController::class, 'storeAchievement'])->name('players.identity.achievements.store');
    Route::get('matches', [MatchController::class, 'index'])->name('matches.index');
    Route::post('matches', [MatchController::class, 'store'])->name('matches.store');
    Route::get('matches/{match}/scorekeeper', [ScoreController::class, 'show'])->name('matches.scorekeeper');
    Route::post('matches/{match}/score', [ScoreController::class, 'score'])->name('matches.score');
    Route::post('matches/{match}/undo', [ScoreController::class, 'undo'])->name('matches.undo');
    Route::post('matches/{match}/verify', [ScoreController::class, 'verify'])->name('matches.verify');
    Route::post('matches/{match}/disputes', [ScoreController::class, 'dispute'])->name('matches.disputes.store');
    Route::get('open-play', [OpenPlayController::class, 'index'])->name('open-play.index');
    Route::post('open-play', [OpenPlayController::class, 'store'])->name('open-play.store');
    Route::post('open-play/{session}/groups', [OpenPlayController::class, 'group'])->name('open-play.groups.store');
    Route::post('open-play/{session}/release-board', [OpenPlayController::class, 'releaseBoard'])->name('open-play.release-board');
    Route::post('open-play/{session}/collect/{player}', [OpenPlayController::class, 'settlePlayer'])->name('open-play.players.settle');
    Route::post('open-play/{session}/players/{player}', [OpenPlayController::class, 'join'])->name('open-play.join');
    Route::post('open-play/{session}/players/{player}/check-in', [OpenPlayController::class, 'checkIn'])->name('open-play.check-in');
    Route::post('open-play/{session}/matches/{match}/complete', [OpenPlayController::class, 'completeMatch'])->name('open-play.matches.complete');
    Route::get('rankings', [RankingController::class, 'index'])->name('rankings.index');
    Route::get('players/rankings', [RankingController::class, 'index'])->name('players.rankings');
    Route::get('tournaments', [TournamentController::class, 'index'])->name('tournaments.index');
    Route::post('tournaments', [TournamentController::class, 'store'])->name('tournaments.store');
    Route::post('tournaments/{tournament}/brackets', [TournamentController::class, 'generateBracket'])->name('tournaments.brackets.generate');
    Route::get('memberships', [MembershipController::class, 'index'])->name('memberships.index');
    Route::post('membership-plans', [MembershipController::class, 'storePlan'])->name('membership-plans.store');
    Route::post('player-memberships', [MembershipController::class, 'storeMembership'])->name('player-memberships.store');
    Route::post('waiver-templates', [MembershipController::class, 'storeWaiverTemplate'])->name('waiver-templates.store');
    Route::get('coaches', [CoachController::class, 'index'])->name('coaches.index');
    Route::post('coaches', [CoachController::class, 'store'])->name('coaches.store');
    Route::get('staff', [StaffController::class, 'index'])->name('staff.index');
    Route::post('staff', [StaffController::class, 'storeProfile'])->name('staff.store');
    Route::post('staff/attendance', [StaffController::class, 'storeAttendance'])->name('staff.attendance.store');
    Route::get('reports', ReportsController::class)->name('reports.index');
    Route::get('support-tickets', [SupportTicketController::class, 'index'])->name('support-tickets.index');
    Route::post('support-tickets', [SupportTicketController::class, 'store'])->name('support-tickets.store');
    Route::post('support-tickets/{supportTicket}/messages', [SupportTicketController::class, 'message'])->name('support-tickets.messages.store');
    Route::get('notifications', [NotificationCenterController::class, 'index'])->name('notifications.index');
    Route::get('notifications/recent', [NotificationCenterController::class, 'recent'])->name('notifications.recent');
    Route::post('notifications/read-all', [NotificationCenterController::class, 'markAllRead'])->name('notifications.read-all');
    Route::post('notifications/{courtPrimeNotification}/read', [NotificationCenterController::class, 'markRead'])->name('notifications.read');
    Route::get('pos', [POSController::class, 'index'])->name('pos.index');
    Route::post('pos', [POSController::class, 'store'])->name('pos.store');
    Route::get('pos/{posTransaction}/receipt', [POSController::class, 'receipt'])->name('pos.receipt');
    Route::get('cashier-sessions', [CashierSessionController::class, 'index'])->name('cashier-sessions.index');
    Route::post('cashier-sessions', [CashierSessionController::class, 'store'])->name('cashier-sessions.store');
    Route::post('cashier-sessions/{cashierSession}/close', [CashierSessionController::class, 'close'])->name('cashier-sessions.close');
    Route::get('payments', [PaymentController::class, 'index'])->name('payments.index');
    Route::post('payments/{payment}/refunds', [PaymentController::class, 'refund'])->name('payments.refunds.store');
    Route::get('accounts-receivable', [AccountReceivableController::class, 'index'])->name('accounts-receivable.index');
    Route::post('accounts-receivable', [AccountReceivableController::class, 'store'])->name('accounts-receivable.store');
    Route::post('accounts-receivable/{accountReceivable}/payments', [AccountReceivableController::class, 'payment'])->name('accounts-receivable.payments.store');
    Route::get('expenses', [ExpenseController::class, 'index'])->name('expenses.index');
    Route::post('expenses', [ExpenseController::class, 'store'])->name('expenses.store');
    Route::get('products', [ProductController::class, 'index'])->name('products.index');
    Route::post('products', [ProductController::class, 'store'])->name('products.store');
    Route::get('inventory', [InventoryController::class, 'index'])->name('inventory.index');
    Route::get('stock-transfers', [StockTransferController::class, 'index'])->name('stock-transfers.index');
    Route::post('stock-transfers', [StockTransferController::class, 'store'])->name('stock-transfers.store');
    Route::post('stock-transfers/{stockTransfer}/send', [StockTransferController::class, 'send'])->name('stock-transfers.send');
    Route::post('stock-transfers/{stockTransfer}/receive', [StockTransferController::class, 'receive'])->name('stock-transfers.receive');
    Route::get('reservations', [ReservationController::class, 'index'])->name('reservations.index');
    Route::post('reservations', [ReservationController::class, 'store'])->name('reservations.store');
    Route::get('scheduler', [SchedulerController::class, 'index'])->name('scheduler.index');
    Route::get('check-in', [CheckInController::class, 'index'])->name('check-in.index');
    Route::post('check-in/{reservation}', [CheckInController::class, 'checkIn'])->name('check-in.store');
    Route::post('check-in/{reservation}/start', [CheckInController::class, 'start'])->name('check-in.start');
    Route::post('check-in/{reservation}/complete', [CheckInController::class, 'complete'])->name('check-in.complete');
    Route::get('live-courts', [LiveCourtController::class, 'index'])->name('live-courts.index');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
