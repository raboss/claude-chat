-- ============================================================
-- Ra Workshop 2023 - Schema Export
-- Source: LocalDB (RaWorkshopLocalDB) on Windows laptop
-- Generated: 2026-04-07 09:16:28
-- For Claude-Nour - NourWork integration project
-- ============================================================

-- ============================================================
-- DATABASE: RaConfig
-- ============================================================

-- ----- RaConfig.Company -----
CREATE TABLE [RaConfig].[dbo].[Company] (
  [Id] int IDENTITY(1,1) NOT NULL,
  [CUI] nvarchar(20),
  [RegistrationNumber] nvarchar(20),
  [Bank] nvarchar(20),
  [IBAN] nvarchar(24),
  [RowSignature] timestamp NOT NULL,
  CONSTRAINT [PK_Company] PRIMARY KEY ([Id])
);
-- Row count: 1

-- ----- RaConfig.Contact -----
CREATE TABLE [RaConfig].[dbo].[Contact] (
  [Id] int IDENTITY(1,1) NOT NULL,
  [Guid] uniqueidentifier NOT NULL,
  [Name] nvarchar(50) NOT NULL,
  [Address] nvarchar(255),
  [County] nvarchar(50),
  [Phone] nvarchar(50),
  [Fax] nvarchar(50),
  [Email] nvarchar(50),
  [IsActive] bit DEFAULT ((1)) NOT NULL,
  [IsCompany] bit NOT NULL,
  [IdContactCategory] int,
  [IdPersonal] int,
  [IdCompany] int,
  [RowSignature] timestamp NOT NULL,
  [UserGuid] uniqueidentifier,
  CONSTRAINT [PK_Contact] PRIMARY KEY ([Id])
);
ALTER TABLE [RaConfig].[dbo].[Contact] ADD CONSTRAINT [FContactContactCategory] FOREIGN KEY ([IdContactCategory]) REFERENCES [ContactCategory]([Id]);
ALTER TABLE [RaConfig].[dbo].[Contact] ADD CONSTRAINT [FkContactPersonal] FOREIGN KEY ([IdPersonal]) REFERENCES [Personal]([Id]);
ALTER TABLE [RaConfig].[dbo].[Contact] ADD CONSTRAINT [FkContactCompany] FOREIGN KEY ([IdCompany]) REFERENCES [Company]([Id]);
-- Row count: 32

-- ----- RaConfig.Currency -----
CREATE TABLE [RaConfig].[dbo].[Currency] (
  [Id] int IDENTITY(1,1) NOT NULL,
  [ShortName] nvarchar(8) NOT NULL,
  [IsReference] bit NOT NULL,
  [IsDefault] bit NOT NULL,
  [RowSignature] timestamp NOT NULL,
  [Precision] int NOT NULL,
  [Symbol] nvarchar(8),
  [IsVisible] bit,
  CONSTRAINT [PK_Currency] PRIMARY KEY ([Id])
);
-- Row count: 104

-- ----- RaConfig.Unit -----
CREATE TABLE [RaConfig].[dbo].[Unit] (
  [Id] int IDENTITY(1,1) NOT NULL,
  [Precision] int NOT NULL,
  [IsFundamental] bit NOT NULL,
  [FundamentalFraction] decimal(37,20) DEFAULT ((1)) NOT NULL,
  [UnitType] nvarchar(128) NOT NULL,
  [IsReadOnly] bit NOT NULL,
  [RowSignature] timestamp NOT NULL,
  [Symbol] nvarchar(128) NOT NULL,
  [MeasurementSystem] nvarchar(128) NOT NULL,
  CONSTRAINT [PK_Unit] PRIMARY KEY ([Id])
);
-- Row count: 98

-- ----- RaConfig.Personal -----
CREATE TABLE [RaConfig].[dbo].[Personal] (
  [Id] int IDENTITY(1,1) NOT NULL,
  [CNP] nvarchar(20),
  [SerieId] nvarchar(20),
  [NumberId] nvarchar(20),
  [IssueDateId] datetime,
  [IssueAuthorityId] nvarchar(50),
  [ExtraInfo] nvarchar(50),
  [IdCompany] int,
  [RowSignature] timestamp NOT NULL,
  CONSTRAINT [PK_Personal] PRIMARY KEY ([Id])
);
ALTER TABLE [RaConfig].[dbo].[Personal] ADD CONSTRAINT [FkCompanyPersonal] FOREIGN KEY ([IdCompany]) REFERENCES [Company]([Id]);
-- Row count: 31

-- ----- RaConfig.DbSettings -----
CREATE TABLE [RaConfig].[dbo].[DbSettings] (
  [Id] int IDENTITY(1,1) NOT NULL,
  [Name] nvarchar(128) NOT NULL,
  [ValueBinary] varbinary(MAX),
  [ValueGuid] uniqueidentifier,
  [ValueString] nvarchar(MAX),
  [ValueInt] int,
  [ValueBool] bit,
  [ValueDecimal] decimal(27,10),
  [Type] nvarchar(128),
  [UserName] nvarchar(50),
  [IsUser] bit,
  [RowSignature] timestamp NOT NULL
);
-- Row count: 462

-- ============================================================
-- DATABASE: RaMaterials
-- ============================================================

-- ----- RaMaterials.Series -----
CREATE TABLE [RaMaterials].[dbo].[Series] (
  [Id] int IDENTITY(1,1) NOT NULL,
  [Guid] uniqueidentifier NOT NULL,
  [Code] nvarchar(128) NOT NULL,
  [SashTolerance] decimal(27,10) NOT NULL,
  [GasketMinTolerance] decimal(27,10) NOT NULL,
  [GasketMaxTolerance] decimal(27,10) DEFAULT ((0)) NOT NULL,
  [FillingTolerance] decimal(27,10) NOT NULL,
  [MaterialType] nvarchar(128) DEFAULT ((0)) NOT NULL,
  [SeriesType] nvarchar(512) NOT NULL,
  [ThresholdTolerance] decimal(27,10) NOT NULL,
  [NoThresholdTolerance] decimal(27,10) NOT NULL,
  [LinkSashTolerance] decimal(27,10) NOT NULL,
  [RollerExtension] decimal(27,10) NOT NULL,
  [RowSignature] timestamp NOT NULL,
  [IdWASchema] int,
  [IdWindowProcessingOperation] int,
  [UseCover] bit NOT NULL,
  [FoldingWingType] nvarchar(128) NOT NULL,
  [DoubleWingWithAdapter] bit NOT NULL,
  [RevisionDate] datetime,
  [RevisionInfo] nvarchar(255),
  [UseHookSection] bit NOT NULL,
  [HeatTransferCoefficient] decimal(37,10),
  [RoughOpeningTolerance] decimal(27,10) NOT NULL,
  [IdCostGroup] int,
  [Currency] nvarchar(128) NOT NULL,
  [ThicknessIntervals] nvarchar(128),
  [SlideAndSwingWingType] nvarchar(128) NOT NULL,
  [IsActive] bit NOT NULL,
  [DynamicRawSectionCodeFormat] nvarchar(128),
  [DynamicRawSectionDesignationFormat] nvarchar(128),
  [VariableWidthSectionCodeFormat] nvarchar(128),
  [UseMinAsFirstDynamicDim] bit,
  [DynamicFirstTolerance] decimal(27,10) NOT NULL,
  [DynamicOtherTolerance] decimal(27,10) NOT NULL,
  [DynamicFirstPrecision] decimal(27,10) NOT NULL,
  [DynamicOtherPrecision] decimal(27,10) NOT NULL,
  CONSTRAINT [PK_Series] PRIMARY KEY ([Id])
);
ALTER TABLE [RaMaterials].[dbo].[Series] ADD CONSTRAINT [FkWASchemaSeries] FOREIGN KEY ([IdWASchema]) REFERENCES [WASchema]([Id]);
ALTER TABLE [RaMaterials].[dbo].[Series] ADD CONSTRAINT [FkWindowProcessingOperationSeries] FOREIGN KEY ([IdWindowProcessingOperation]) REFERENCES [WindowProcessingOperation]([Id]);
ALTER TABLE [RaMaterials].[dbo].[Series] ADD CONSTRAINT [FK_CostGroup_Series] FOREIGN KEY ([IdCostGroup]) REFERENCES [CostGroup]([Id]);
-- Row count: 6

-- ----- RaMaterials.Section -----
CREATE TABLE [RaMaterials].[dbo].[Section] (
  [Id] int IDENTITY(1,1) NOT NULL,
  [Guid] uniqueidentifier NOT NULL,
  [Code] nvarchar(128) NOT NULL,
  [Image] varbinary(MAX),
  [H] decimal(27,10) NOT NULL,
  [H1] decimal(27,10) NOT NULL,
  [H2] decimal(27,10) NOT NULL,
  [H3] decimal(27,10) NOT NULL,
  [W] decimal(27,10) NOT NULL,
  [W1] decimal(27,10) NOT NULL,
  [BarLength] decimal(27,10) NOT NULL,
  [CuttingTolerance] decimal(27,10) NOT NULL,
  [BindingTolerance] decimal(27,10) NOT NULL,
  [ProcessingTolerance] decimal(27,10),
  [UseCompensation] bit NOT NULL,
  [IdReinforcement] int,
  [IdConsumeGroup] int NOT NULL,
  [SectionType] nvarchar(128) NOT NULL,
  [MaterialType] nvarchar(128) NOT NULL,
  [HasThermalBreak] bit NOT NULL,
  [TrackNumber] int NOT NULL,
  [Ready] bit NOT NULL,
  [PriceCalculationType] nvarchar(25) NOT NULL,
  [GenerateConsume] bit NOT NULL,
  [FixingMode] nvarchar(128) NOT NULL,
  [RowSignature] timestamp NOT NULL,
  [IsForOptimization] bit NOT NULL,
  [UseDoubleCut] bit NOT NULL,
  [BinSize] int NOT NULL,
  [OptimizationInventoryUseType] nvarchar(128) NOT NULL,
  [OptimizationMinLimitLength] decimal(27,10) NOT NULL,
  [OptimizationMinInventoryLength] decimal(27,10) NOT NULL,
  [OptimizationMaxLimitLength] decimal(18,0) NOT NULL,
  [OptimizationTargetInventory] decimal(27,10) NOT NULL,
  [OptimizationMaxInventory] decimal(27,10) NOT NULL,
  [CurvingAddition] decimal(27,10) NOT NULL,
  [IsExtra] bit NOT NULL,
  [UnitWeight] decimal(27,10) NOT NULL,
  [DefaultUnitBasePrice] decimal(37,10) NOT NULL,
  [Perimeter] decimal(27,10) NOT NULL,
  [CuttingType] nvarchar(128) DEFAULT ('StraightCut') NOT NULL,
  [KnownSide] nvarchar(128) DEFAULT ('All') NOT NULL,
  [SashTolerance] decimal(27,10),
  [FoldingSash2SashTolerance] decimal(27,10),
  [HeatTransferCoefficient] decimal(37,10) NOT NULL,
  [Ix] decimal(37,10),
  [Iy] decimal(37,10),
  [CurvingMode] nvarchar(128) NOT NULL,
  [Area] decimal(27,10) NOT NULL,
  [IdRawSection] int,
  [RawSectionTolerance] decimal(27,10) NOT NULL,
  [FillingTolerance] decimal(27,10),
  [CoversInnerTemplates] nvarchar(128) NOT NULL,
  [TenonTolerance] decimal(27,10) NOT NULL,
  [DowelTolerance] decimal(27,10) NOT NULL,
  [UseRawSectionInfo] bit NOT NULL,
  [IdArcRawSection] int,
  [ArcRawSectionTolerance] decimal(37,10),
  [DefaultCurrency] nvarchar(128) NOT NULL,
  [HasGasket] bit DEFAULT ((0)) NOT NULL,
  [ExtendingMode] nvarchar(128) NOT NULL,
  [MinSegmentLength] decimal(27,10) NOT NULL,
  [MaxSegmentLength] decimal(27,10) NOT NULL,
  [MaxSegmentedLength] decimal(27,10) NOT NULL,
  [CornerCuttingType] nvarchar(128),
  [AltersInnerGeometry] bit,
  [DisplayOrder] int,
  [IsActive] bit NOT NULL,
  [MinRadius] decimal(27,10) NOT NULL,
  [MullionDowelTolerance] decimal(27,10) NOT NULL,
  [MullionTenonTolerance] decimal(27,10) NOT NULL,
  [AdapterTolerance] decimal(27,10) NOT NULL,
  [ExtraSashDimension] decimal(27,10) NOT NULL,
  [NoThresholdTolerance] decimal(27,10),
  [MaterialSpeciesUsage] nvarchar(128) NOT NULL,
  [SlideSwingTolerance] decimal(27,10),
  [CouplingAngle] decimal(27,10),
  [IsCouplingAngleFixed] bit NOT NULL,
  [RawSectionType] nvarchar(128) NOT NULL,
  [RawH] decimal(27,10) NOT NULL,
  [RawW] decimal(27,10) NOT NULL,
  [UsePriceOnRawSection] bit NOT NULL,
  [HasVariableW] bit NOT NULL,
  [MaxW] decimal(27,10) NOT NULL,
  [WInputTolerance] decimal(27,10) NOT NULL,
  [UseMaterialSpeciesDefinition] bit NOT NULL,
  [WOffset] decimal(27,10),
  [TrackDistance] decimal(27,10),
  [Dxf] varchar(MAX),
  [GlassOffset] decimal(27,10),
  [CodeFormatInfo] nvarchar(128),
  CONSTRAINT [PK_Section] PRIMARY KEY ([Id])
);
ALTER TABLE [RaMaterials].[dbo].[Section] ADD CONSTRAINT [FkReinforcementSection] FOREIGN KEY ([IdReinforcement]) REFERENCES [Section]([Id]);
ALTER TABLE [RaMaterials].[dbo].[Section] ADD CONSTRAINT [FkConsumeGroupSection] FOREIGN KEY ([IdConsumeGroup]) REFERENCES [ConsumeGroup]([Id]);
ALTER TABLE [RaMaterials].[dbo].[Section] ADD CONSTRAINT [FkSectionRawSection] FOREIGN KEY ([IdRawSection]) REFERENCES [Section]([Id]);
ALTER TABLE [RaMaterials].[dbo].[Section] ADD CONSTRAINT [Fk_Section_ArcRawSection] FOREIGN KEY ([IdArcRawSection]) REFERENCES [Section]([Id]);
-- Row count: 248

-- ----- RaMaterials.SeriesSection -----
CREATE TABLE [RaMaterials].[dbo].[SeriesSection] (
  [Id] int IDENTITY(1,1) NOT NULL,
  [IdSeries] int NOT NULL,
  [IdSection] int NOT NULL,
  [RowSignature] timestamp NOT NULL,
  [Priority] decimal(27,10),
  CONSTRAINT [PK_SeriesSection] PRIMARY KEY ([Id])
);
ALTER TABLE [RaMaterials].[dbo].[SeriesSection] ADD CONSTRAINT [FkSeriesSeriesSection] FOREIGN KEY ([IdSeries]) REFERENCES [Series]([Id]);
ALTER TABLE [RaMaterials].[dbo].[SeriesSection] ADD CONSTRAINT [FkSectionSeriesSection] FOREIGN KEY ([IdSection]) REFERENCES [Section]([Id]);
-- Row count: 293

-- ----- RaMaterials.Glass -----
CREATE TABLE [RaMaterials].[dbo].[Glass] (
  [Id] int IDENTITY(1,1) NOT NULL,
  [Guid] uniqueidentifier NOT NULL,
  [Code] nvarchar(128) NOT NULL,
  [DefaultPrice] decimal(37,10) NOT NULL,
  [Thickness] decimal(37,10) NOT NULL,
  [IdCostGroup] int,
  [IdConsumeGroup] int NOT NULL,
  [Width] decimal(37,10) NOT NULL,
  [FillingType] nvarchar(128) NOT NULL,
  [IdGlassType] int NOT NULL,
  [Sheet1Info] nvarchar(128),
  [Sheet2Info] nvarchar(128),
  [Sheet3Info] nvarchar(128),
  [Spacer1Dimension] decimal(37,10),
  [Spacer2Dimension] decimal(37,10),
  [Gas1] bit NOT NULL,
  [Gas2] bit NOT NULL,
  [GenerateConsume] bit NOT NULL,
  [RowSignature] timestamp NOT NULL,
  [IdCostGroupIrregular] int,
  [UnitPriceType] nvarchar(128) NOT NULL,
  [IsExtra] bit NOT NULL,
  [MinSurface] decimal(37,10) NOT NULL,
  [MinHeight] decimal(37,10) NOT NULL,
  [MinWidth] decimal(37,10) NOT NULL,
  [MaxHeight] decimal(37,10),
  [MaxWidth] decimal(37,10),
  [UnitWeight] decimal(37,10) NOT NULL,
  [UseEnclosingRectangle] bit NOT NULL,
  [Image] varbinary(MAX),
  [HeatTransferCoefficient] decimal(37,10) NOT NULL,
  [LinearHeatTransferCoefficient] decimal(37,10) NOT NULL,
  [IdLinearLengthFormula] int,
  [IdGlassFamily] int,
  [MaxSurface] decimal(27,10),
  [DefaultCurrency] nvarchar(128) NOT NULL,
  [OrnamentalGrillMaxThickness] decimal(27,10),
  [OrnamentalGrillTolerance] decimal(27,10),
  [CanUseOrnamentalGrill] bit NOT NULL,
  [IdColorCombination] int NOT NULL,
  [CanBePainted] bit DEFAULT ((0)) NOT NULL,
  [MatchColor] bit DEFAULT ((0)) NOT NULL,
  [PaintingPrice] decimal(37,10) DEFAULT ((0)) NOT NULL,
  [IsActive] bit NOT NULL,
  [Sheet1Dimension] decimal(37,10),
  [Sheet2Dimension] decimal(37,10),
  [Sheet3Dimension] decimal(37,10),
  [SpacerType] nvarchar(128),
  CONSTRAINT [PK_Glass] PRIMARY KEY ([Id])
);
ALTER TABLE [RaMaterials].[dbo].[Glass] ADD CONSTRAINT [FkCostGroupGlass] FOREIGN KEY ([IdCostGroup]) REFERENCES [CostGroup]([Id]);
ALTER TABLE [RaMaterials].[dbo].[Glass] ADD CONSTRAINT [FkConsumeGroupGlass] FOREIGN KEY ([IdConsumeGroup]) REFERENCES [ConsumeGroup]([Id]);
ALTER TABLE [RaMaterials].[dbo].[Glass] ADD CONSTRAINT [FkGlassGlassType] FOREIGN KEY ([IdGlassType]) REFERENCES [GlassType]([Id]);
ALTER TABLE [RaMaterials].[dbo].[Glass] ADD CONSTRAINT [FKGlassIdCostGroupIrregular] FOREIGN KEY ([IdCostGroupIrregular]) REFERENCES [CostGroup]([Id]);
ALTER TABLE [RaMaterials].[dbo].[Glass] ADD CONSTRAINT [Fk_FormulaId_to_IdLinearLengthFormulaGlass] FOREIGN KEY ([IdLinearLengthFormula]) REFERENCES [LinearLengthFormula]([Id]);
ALTER TABLE [RaMaterials].[dbo].[Glass] ADD CONSTRAINT [FkGlassGlassFamily] FOREIGN KEY ([IdGlassFamily]) REFERENCES [GlassFamily]([Id]);
ALTER TABLE [RaMaterials].[dbo].[Glass] ADD CONSTRAINT [FkColorCombinationGlass] FOREIGN KEY ([IdColorCombination]) REFERENCES [ColorCombination]([Id]);
-- Row count: 51

-- ----- RaMaterials.GlassType -----
CREATE TABLE [RaMaterials].[dbo].[GlassType] (
  [Id] int IDENTITY(1,1) NOT NULL,
  [Guid] uniqueidentifier NOT NULL,
  [IdConsumeGroup] int NOT NULL,
  [IdCostGroup] int,
  [RowSignature] timestamp NOT NULL,
  [IdCostGroupIrregular] int,
  CONSTRAINT [PK_GlassType] PRIMARY KEY ([Id])
);
ALTER TABLE [RaMaterials].[dbo].[GlassType] ADD CONSTRAINT [FkGlassTypeConsumeGroup] FOREIGN KEY ([IdConsumeGroup]) REFERENCES [ConsumeGroup]([Id]);
ALTER TABLE [RaMaterials].[dbo].[GlassType] ADD CONSTRAINT [FkGlassTypeCostGroup] FOREIGN KEY ([IdCostGroup]) REFERENCES [CostGroup]([Id]);
ALTER TABLE [RaMaterials].[dbo].[GlassType] ADD CONSTRAINT [FKGlassTypeIdCostGroupIrregular] FOREIGN KEY ([IdCostGroupIrregular]) REFERENCES [CostGroup]([Id]);
-- Row count: 3

-- ----- RaMaterials.Accessory -----
CREATE TABLE [RaMaterials].[dbo].[Accessory] (
  [Id] int IDENTITY(1,1) NOT NULL,
  [Guid] uniqueidentifier NOT NULL,
  [Code] nvarchar(128) NOT NULL,
  [IsForOptimization] bit NOT NULL,
  [BarLength] decimal(27,10) NOT NULL,
  [CuttingTolerance] decimal(27,10) NOT NULL,
  [DefaultPrice] decimal(37,10) NOT NULL,
  [Image] varbinary(MAX),
  [IdAccessoryType] int NOT NULL,
  [IdConsumeGroup] int NOT NULL,
  [IdCostGroup] int,
  [RowSignature] timestamp NOT NULL,
  [UseDoubleCut] bit,
  [BinSize] int,
  [OptimizationInventoryUseType] nvarchar(128),
  [OptimizationMinLimitLength] decimal(18,0),
  [OptimizationMinInventoryLength] decimal(18,0),
  [OptimizationMaxLimitLength] decimal(18,0),
  [OptimizationTargetInventory] decimal(18,0),
  [OptimizationMaxInventory] decimal(18,0),
  [UnitPriceType] nvarchar(128) NOT NULL,
  [IsExtra] bit NOT NULL,
  [Unit] nvarchar(128),
  [PacketUnit] nvarchar(128),
  [UnitWeight] decimal(37,10) NOT NULL,
  [DefaultCurrency] nvarchar(128) NOT NULL,
  [IsActive] bit NOT NULL,
  [ExtendingMode] nvarchar(128) NOT NULL,
  [MinSegmentLength] decimal(18,0) NOT NULL,
  [MaxSegmentLength] decimal(18,0) NOT NULL,
  [MaxSegmentedLength] decimal(18,0) NOT NULL,
  [Tag] nvarchar(128),
  CONSTRAINT [PK_Accessory] PRIMARY KEY ([Id])
);
ALTER TABLE [RaMaterials].[dbo].[Accessory] ADD CONSTRAINT [FkAccessoryTypeAccessory] FOREIGN KEY ([IdAccessoryType]) REFERENCES [AccessoryType]([Id]);
ALTER TABLE [RaMaterials].[dbo].[Accessory] ADD CONSTRAINT [FkConsumeGroupAccessory] FOREIGN KEY ([IdConsumeGroup]) REFERENCES [ConsumeGroup]([Id]);
ALTER TABLE [RaMaterials].[dbo].[Accessory] ADD CONSTRAINT [FkCostGroupAccessory] FOREIGN KEY ([IdCostGroup]) REFERENCES [CostGroup]([Id]);
-- Row count: 344

-- ----- RaMaterials.AccessoryType -----
CREATE TABLE [RaMaterials].[dbo].[AccessoryType] (
  [Id] int IDENTITY(1,1) NOT NULL,
  [Guid] uniqueidentifier NOT NULL,
  [IdConsumeGroup] int NOT NULL,
  [IdCostGroup] int,
  [RowSignature] timestamp NOT NULL,
  CONSTRAINT [PK_AccessoryType] PRIMARY KEY ([Id])
);
ALTER TABLE [RaMaterials].[dbo].[AccessoryType] ADD CONSTRAINT [FkConsumeGroupAccessoryType] FOREIGN KEY ([IdConsumeGroup]) REFERENCES [ConsumeGroup]([Id]);
ALTER TABLE [RaMaterials].[dbo].[AccessoryType] ADD CONSTRAINT [FkCostGroupAccessoryType] FOREIGN KEY ([IdCostGroup]) REFERENCES [CostGroup]([Id]);
-- Row count: 4

-- ----- RaMaterials.Color -----
CREATE TABLE [RaMaterials].[dbo].[Color] (
  [Id] int IDENTITY(1,1) NOT NULL,
  [Guid] uniqueidentifier NOT NULL,
  [Code] nvarchar(128) NOT NULL,
  [RGB] int NOT NULL,
  [RowSignature] timestamp NOT NULL,
  CONSTRAINT [PK_Color] PRIMARY KEY ([Id])
);
-- Row count: 19

-- ----- RaMaterials.ColorList -----
CREATE TABLE [RaMaterials].[dbo].[ColorList] (
  [Id] int IDENTITY(1,1) NOT NULL,
  [Code] nvarchar(128) NOT NULL,
  [Guid] uniqueidentifier NOT NULL,
  [RowSignature] timestamp NOT NULL,
  [PriceCalculationType] nvarchar(128) NOT NULL,
  [DefaultPrice] decimal(37,10) NOT NULL,
  [DefaultPriceTB] decimal(37,10) NOT NULL,
  [IdCostGroup] int,
  [DefaultCurrency] nvarchar(128),
  [IsActive] bit NOT NULL,
  [Tag] nvarchar(128),
  CONSTRAINT [PK_ColorList] PRIMARY KEY ([Id])
);
ALTER TABLE [RaMaterials].[dbo].[ColorList] ADD CONSTRAINT [Fk_ColorList_CostGroup] FOREIGN KEY ([IdCostGroup]) REFERENCES [CostGroup]([Id]);
-- Row count: 17

-- ----- RaMaterials.ColorListItem -----
CREATE TABLE [RaMaterials].[dbo].[ColorListItem] (
  [Id] int IDENTITY(1,1) NOT NULL,
  [IdColorList] int NOT NULL,
  [IdColorCombination] int NOT NULL,
  [RowSignature] timestamp NOT NULL,
  [Prefix] nvarchar(16),
  [Suffix] nvarchar(16),
  [DefaultPrice] decimal(37,10),
  [DefaultPriceTB] decimal(37,10),
  [IdCostGroup] int,
  [FormatCode] nvarchar(128),
  CONSTRAINT [PK_ColorListItem] PRIMARY KEY ([Id])
);
ALTER TABLE [RaMaterials].[dbo].[ColorListItem] ADD CONSTRAINT [FkColorListCLI] FOREIGN KEY ([IdColorList]) REFERENCES [ColorList]([Id]);
ALTER TABLE [RaMaterials].[dbo].[ColorListItem] ADD CONSTRAINT [FkCCListItem] FOREIGN KEY ([IdColorCombination]) REFERENCES [ColorCombination]([Id]);
ALTER TABLE [RaMaterials].[dbo].[ColorListItem] ADD CONSTRAINT [Fk_CostGroup_ColorListItem] FOREIGN KEY ([IdCostGroup]) REFERENCES [CostGroup]([Id]);
-- Row count: 38

-- ----- RaMaterials.Range -----
CREATE TABLE [RaMaterials].[dbo].[Range] (
  [Id] int IDENTITY(1,1) NOT NULL,
  [IdWindowAccessory] int NOT NULL,
  [WingType] nvarchar(128) NOT NULL,
  [ShapeType] uniqueidentifier,
  [StatusType] nvarchar(128),
  [RowSignature] timestamp NOT NULL,
  [StructureType] nvarchar(128),
  CONSTRAINT [PK_Range] PRIMARY KEY ([Id])
);
ALTER TABLE [RaMaterials].[dbo].[Range] ADD CONSTRAINT [FkWARange] FOREIGN KEY ([IdWindowAccessory]) REFERENCES [WindowAccessory]([Id]);
-- Row count: 12

-- ----- RaMaterials.Rule -----
CREATE TABLE [RaMaterials].[dbo].[Rule] (
  [Id] int IDENTITY(1,1) NOT NULL,
  [Guid] uniqueidentifier NOT NULL,
  [IdWindowAccessory] int,
  [IdWindowHandwork] int,
  [IdAccessory1] int,
  [IdAccessory2] int,
  [IdHandwork1] int,
  [SeriesCode] nvarchar(128),
  [Section1Code] nvarchar(128),
  [Section2Code] nvarchar(128),
  [Quantity] decimal(27,10),
  [A] decimal(27,10) DEFAULT ((0)),
  [B] decimal(27,10) DEFAULT ((0)),
  [C] decimal(27,10) DEFAULT ((0)),
  [GasketSpace] decimal(27,10),
  [IdRange] int,
  [IdRuleTemplate] int NOT NULL,
  [SectionUsageMode] nvarchar(128),
  [StatusType] nvarchar(128),
  [OpeningType] nvarchar(128),
  [StructureType] nvarchar(128),
  [OpeningSide] nvarchar(128),
  [ShapeTypeGuid] uniqueidentifier,
  [SectionType] nvarchar(128),
  [CuttingType] nvarchar(128),
  [JoinType] nvarchar(128),
  [WingType] nvarchar(128),
  [PanelType] nvarchar(128),
  [BendType] nvarchar(128),
  [AngleType] nvarchar(128),
  [RowSignature] timestamp NOT NULL,
  [Description] nvarchar(256),
  [IdWindowProcessingOperation] int,
  [IdProcessingOperation1] int,
  [SectionOrientation] nvarchar(128),
  [SectionPosition] nvarchar(128),
  [PosX] decimal(27,10),
  [ReinforcementType] nvarchar(128),
  [ColorCombinationType] nvarchar(128),
  [AlignmentType] nvarchar(128),
  [RuleFunction] nvarchar(128),
  [FillingType] nvarchar(128),
  [CustomProfile] nvarchar(128),
  [SlidingTrackCount] int,
  [LeafCount] int,
  [SlidingWingType] nvarchar(50),
  [SlidingTrackNumber] int,
  [IdWindowCustomMessage] int,
  [IdCustomMessage1] int,
  [IdWindowTechnicalParameter] int,
  [IdTechnicalParameter1] int,
  [Value] decimal(27,10),
  [SectionFacePosition] nvarchar(128),
  [GeneratorFace] nvarchar(128),
  [Tag] nvarchar(32),
  [GlassCode] nvarchar(128),
  [MaterialSpeciesCode] nvarchar(128),
  [HasConditionSet] bit,
  [SlidingWingTypeOld] int,
  CONSTRAINT [PK_Rule] PRIMARY KEY ([Id])
);
ALTER TABLE [RaMaterials].[dbo].[Rule] ADD CONSTRAINT [FkRuleWindowAccessory] FOREIGN KEY ([IdWindowAccessory]) REFERENCES [WindowAccessory]([Id]);
ALTER TABLE [RaMaterials].[dbo].[Rule] ADD CONSTRAINT [FkRuleWindowHandwork] FOREIGN KEY ([IdWindowHandwork]) REFERENCES [WindowHandwork]([Id]);
ALTER TABLE [RaMaterials].[dbo].[Rule] ADD CONSTRAINT [FKRuleIdAccessory1] FOREIGN KEY ([IdAccessory1]) REFERENCES [Accessory]([Id]);
ALTER TABLE [RaMaterials].[dbo].[Rule] ADD CONSTRAINT [FKRuleIdAccessory2] FOREIGN KEY ([IdAccessory2]) REFERENCES [Accessory]([Id]);
ALTER TABLE [RaMaterials].[dbo].[Rule] ADD CONSTRAINT [FKRuleIdHandwork1] FOREIGN KEY ([IdHandwork1]) REFERENCES [Handwork]([Id]);
ALTER TABLE [RaMaterials].[dbo].[Rule] ADD CONSTRAINT [FkRuleRange] FOREIGN KEY ([IdRange]) REFERENCES [Range]([Id]);
ALTER TABLE [RaMaterials].[dbo].[Rule] ADD CONSTRAINT [FkRuleRuleTemplate] FOREIGN KEY ([IdRuleTemplate]) REFERENCES [RuleTemplate]([Id]);
ALTER TABLE [RaMaterials].[dbo].[Rule] ADD CONSTRAINT [FKRuleIdWindowProcessingOperation] FOREIGN KEY ([IdWindowProcessingOperation]) REFERENCES [WindowProcessingOperation]([Id]);
ALTER TABLE [RaMaterials].[dbo].[Rule] ADD CONSTRAINT [FKRuleIdProcessingOperation1] FOREIGN KEY ([IdProcessingOperation1]) REFERENCES [ProcessingOperation]([Id]);
ALTER TABLE [RaMaterials].[dbo].[Rule] ADD CONSTRAINT [FK_Rule_WindowCustomMessage] FOREIGN KEY ([IdWindowCustomMessage]) REFERENCES [WindowCustomMessage]([Id]);
ALTER TABLE [RaMaterials].[dbo].[Rule] ADD CONSTRAINT [FK_Rule_CustomMessage1] FOREIGN KEY ([IdCustomMessage1]) REFERENCES [CustomMessage]([Id]);
ALTER TABLE [RaMaterials].[dbo].[Rule] ADD CONSTRAINT [FK_Rule_WindowTechnicalParameter] FOREIGN KEY ([IdWindowTechnicalParameter]) REFERENCES [WindowTechnicalParameter]([Id]);
ALTER TABLE [RaMaterials].[dbo].[Rule] ADD CONSTRAINT [FK_Rule_TechnicalParameter1] FOREIGN KEY ([IdTechnicalParameter1]) REFERENCES [TechnicalParameter]([Id]);
-- Row count: 409

-- ----- RaMaterials.WindowAccessory -----
CREATE TABLE [RaMaterials].[dbo].[WindowAccessory] (
  [Id] int IDENTITY(1,1) NOT NULL,
  [Guid] uniqueidentifier NOT NULL,
  [RowSignature] timestamp NOT NULL,
  [RevisionDate] datetime,
  [RevisionInfo] nvarchar(255),
  [IsActive] bit NOT NULL,
  CONSTRAINT [PK_WindowAccessory] PRIMARY KEY ([Id])
);
-- Row count: 3

-- ============================================================
-- DATABASE: RaProjects
-- ============================================================

-- ----- RaProjects.Project -----
CREATE TABLE [RaProjects].[dbo].[Project] (
  [Id] int IDENTITY(1,1) NOT NULL,
  [Guid] uniqueidentifier NOT NULL,
  [Code] nvarchar(128) NOT NULL,
  [Designation] nvarchar(128) NOT NULL,
  [Description] nvarchar(500),
  [CreationDate] datetime NOT NULL,
  [ModifiedDate] datetime,
  [DueDate] datetime,
  [Date] datetime,
  [MainText] nvarchar(MAX),
  [SecondaryText] nvarchar(MAX),
  [CheckOutToUserGuid] uniqueidentifier,
  [CreateByUser] nvarchar(50) NOT NULL,
  [ModifiedByUser] nvarchar(50) NOT NULL,
  [IdProjectPhase] int,
  [IsClosed] bit NOT NULL,
  [IdContact] int,
  [ProjectType] nvarchar(128) NOT NULL,
  [IsInternal] bit DEFAULT ((0)) NOT NULL,
  [ApplicationVersion] nvarchar(50) NOT NULL,
  [IdCostGroup] int,
  [RowSignature] timestamp NOT NULL,
  [DealerGuid] uniqueidentifier,
  [DealerName] nvarchar(50),
  [DealerAddress] nvarchar(255),
  [DealerPhone] nvarchar(50),
  [DealerEmail] nvarchar(50),
  [IdDealerCostGroup] int,
  [IdComponentMaterial] int NOT NULL,
  [ApplicationLanguage] nvarchar(50) NOT NULL,
  [IdTaxesCostGroup] int,
  [WindLoading] decimal(37,10),
  [UseAreaWithCovers] bit NOT NULL,
  [Currency] nvarchar(128) NOT NULL,
  [CreateByUserGuid] uniqueidentifier,
  [PriceCatalogGuid] uniqueidentifier,
  [PriceCatalogDesignation] nvarchar(128),
  [TaxesValue] decimal(18,0),
  [ValueNoTaxes] decimal(18,0),
  [IsDisconnected] bit NOT NULL,
  [ProjectInventoryStatus] nvarchar(50) NOT NULL,
  [ProjectContext] nvarchar(MAX),
  [WindZoneGuid] uniqueidentifier,
  CONSTRAINT [PK_Project] PRIMARY KEY ([Id])
);
ALTER TABLE [RaProjects].[dbo].[Project] ADD CONSTRAINT [FkProjectProjectPhase] FOREIGN KEY ([IdProjectPhase]) REFERENCES [ProjectPhase]([Id]);
ALTER TABLE [RaProjects].[dbo].[Project] ADD CONSTRAINT [FK_Project_Contact] FOREIGN KEY ([IdContact]) REFERENCES [Contact]([Id]);
ALTER TABLE [RaProjects].[dbo].[Project] ADD CONSTRAINT [FkProjectCostGroup] FOREIGN KEY ([IdCostGroup]) REFERENCES [CostGroup]([Id]);
ALTER TABLE [RaProjects].[dbo].[Project] ADD CONSTRAINT [FkProjectDealerCostGroup] FOREIGN KEY ([IdDealerCostGroup]) REFERENCES [CostGroup]([Id]);
ALTER TABLE [RaProjects].[dbo].[Project] ADD CONSTRAINT [FkProjectComponentMaterial] FOREIGN KEY ([IdComponentMaterial]) REFERENCES [ComponentMaterial]([Id]);
ALTER TABLE [RaProjects].[dbo].[Project] ADD CONSTRAINT [FkProjectTaxesCostGroup] FOREIGN KEY ([IdTaxesCostGroup]) REFERENCES [CostGroup]([Id]);
-- Row count: 8

-- ----- RaProjects.Component -----
CREATE TABLE [RaProjects].[dbo].[Component] (
  [Id] int IDENTITY(1,1) NOT NULL,
  [Guid] uniqueidentifier NOT NULL,
  [Code] nvarchar(128) NOT NULL,
  [Designation] nvarchar(128) NOT NULL,
  [BarCode] nvarchar(128),
  [Description] nvarchar(500),
  [Observation] nvarchar(500),
  [IdPrevComponent] int,
  [IdProject] int NOT NULL,
  [Quantity] int NOT NULL,
  [Picture] varbinary(MAX),
  [GeometryData] varbinary(MAX),
  [IdCostGroup] int,
  [IsGeometryCompressed] bit DEFAULT ((1)) NOT NULL,
  [RowSignature] timestamp NOT NULL,
  [IdComponentMaterial] int NOT NULL,
  [ComputingMode] nvarchar(128) NOT NULL,
  [IdComponentGroup] int,
  [PriceListData] varbinary(MAX),
  [TaxesValue] decimal(18,0),
  [ValueNoTaxes] decimal(18,0),
  [SecondaryPicture] varbinary(MAX) DEFAULT (NULL),
  CONSTRAINT [PK_Component] PRIMARY KEY ([Id])
);
ALTER TABLE [RaProjects].[dbo].[Component] ADD CONSTRAINT [FkComponentIdPrevComponent] FOREIGN KEY ([IdPrevComponent]) REFERENCES [Component]([Id]);
ALTER TABLE [RaProjects].[dbo].[Component] ADD CONSTRAINT [FkComponentProject] FOREIGN KEY ([IdProject]) REFERENCES [Project]([Id]);
ALTER TABLE [RaProjects].[dbo].[Component] ADD CONSTRAINT [FkComponentCostGroup] FOREIGN KEY ([IdCostGroup]) REFERENCES [CostGroup]([Id]);
ALTER TABLE [RaProjects].[dbo].[Component] ADD CONSTRAINT [FkComponentComponentMaterial] FOREIGN KEY ([IdComponentMaterial]) REFERENCES [ComponentMaterial]([Id]);
ALTER TABLE [RaProjects].[dbo].[Component] ADD CONSTRAINT [FK__Component__IdCom__31190FD5] FOREIGN KEY ([IdComponentGroup]) REFERENCES [ComponentGroup]([Id]);
-- Row count: 34

-- ----- RaProjects.ComponentMaterial -----
CREATE TABLE [RaProjects].[dbo].[ComponentMaterial] (
  [Id] int IDENTITY(1,1) NOT NULL,
  [MaterialType] nvarchar(128),
  [SeriesGuid] uniqueidentifier,
  [SeriesDesignation] nvarchar(128),
  [SeriesDataSignature] varbinary(16),
  [ColorCombinationGuid] uniqueidentifier,
  [ColorCombinationDesignation] nvarchar(128),
  [ColorCombinationDataSignature] varbinary(16),
  [WASchemaGuid] uniqueidentifier,
  [WASchemaDesignation] nvarchar(128),
  [WASchemaDataSignature] varbinary(16),
  [WindowHandworkGuid] uniqueidentifier,
  [WindowHandworkDesignation] nvarchar(128),
  [WindowHandworkDataSignature] varbinary(16),
  [GlassGuid] uniqueidentifier,
  [GlassDesignation] nvarchar(128),
  [UseGlass] bit,
  [GlassDataSignature] varbinary(16),
  [RowSignature] timestamp NOT NULL,
  [UseCover] bit,
  [CoverColorCombinationGuid] uniqueidentifier,
  [CoverColorCombinationDesignation] nvarchar(128),
  [CoverColorCombinationDataSignature] varbinary(16),
  [MaterialSpeciesGuid] uniqueidentifier,
  [MaterialSpeciesDesignation] nvarchar(128),
  [MaterialSpeciesDataSignature] varbinary(16),
  [SecondaryMaterialSpeciesGuid] uniqueidentifier,
  [SecondaryMaterialSpeciesDesignation] nvarchar(128),
  [SecondaryMaterialSpeciesDataSignature] varbinary(16),
  CONSTRAINT [PK_ComponentMaterial] PRIMARY KEY ([Id])
);
-- Row count: 42

-- ----- RaProjects.ConsumeItem -----
CREATE TABLE [RaProjects].[dbo].[ConsumeItem] (
  [Id] int IDENTITY(1,1) NOT NULL,
  [Guid] uniqueidentifier NOT NULL,
  [Code] nvarchar(128) NOT NULL,
  [Designation] nvarchar(128) NOT NULL,
  [ConsumeGroupGuid] uniqueidentifier,
  [ConsumeGroupDesignation] nvarchar(128),
  [ConsumeGroupPriority] int,
  [Quantity] decimal(27,10) NOT NULL,
  [UnitPrice] decimal(27,10) NOT NULL,
  [CostGroupGuid] uniqueidentifier,
  [CurrencyRate] decimal(27,10) NOT NULL,
  [IdConsumeItem] int,
  [CategoryDesignation] nvarchar(128),
  [Position] nvarchar(128),
  [Length] decimal(27,10),
  [Width] decimal(27,10),
  [Height] decimal(27,10),
  [Surface] decimal(27,10),
  [Angle1] decimal(27,10),
  [Angle2] decimal(27,10),
  [UnitWeight] decimal(27,10),
  [BarLength] decimal(27,10),
  [UnitPriceProduction] decimal(27,10),
  [UnitPriceSelling] decimal(27,10),
  [ConsumeItemType] nvarchar(128) NOT NULL,
  [ConsumeItemStatusType] nvarchar(128) NOT NULL,
  [ExchangeDate] datetime NOT NULL,
  [CuttingTolerance] decimal(27,10) DEFAULT ((0)),
  [IsForOptimization] bit DEFAULT ((0)) NOT NULL,
  [ColorCombinationGuid] uniqueidentifier,
  [IdProject] int,
  [NextPosition] nvarchar(128),
  [IsHorizontal] bit,
  [IsHandle] bit,
  [IsWaterOutlet] bit,
  [IsArc] bit,
  [KnownSide] nvarchar(128),
  [ShapeType] uniqueidentifier,
  [BindingTolerance] decimal(27,10),
  [CodeNoColor] nvarchar(128) NOT NULL,
  [ColorCombinationType] nvarchar(128),
  [IdComponent] int,
  [ShortPosition] nvarchar(128),
  [Duration] decimal(27,10),
  [QuantityLoss] decimal(27,10) NOT NULL,
  [OfferCategory] nvarchar(128),
  [RowSignature] timestamp NOT NULL,
  [CategoryType] nvarchar(128),
  [UnitPriceType] nvarchar(128) NOT NULL,
  [IsExtra] bit NOT NULL,
  [Unit] nvarchar(128),
  [PayedSurface] decimal(27,10),
  [CuttingType1] nvarchar(128),
  [CuttingType2] nvarchar(128),
  [ParentGuid] uniqueidentifier,
  [ProcessingStatus] nvarchar(128),
  [UnitVolume] decimal(27,10),
  [MaterialSpeciesGuid] uniqueidentifier,
  [SeriesCostGroupGuid] uniqueidentifier,
  [Currency] nvarchar(128) NOT NULL,
  [CurrencyDefault] nvarchar(128) NOT NULL,
  [WAngle1] decimal(27,10),
  [WAngle2] decimal(27,10),
  CONSTRAINT [PK_ConsumeItem] PRIMARY KEY ([Id])
);
ALTER TABLE [RaProjects].[dbo].[ConsumeItem] ADD CONSTRAINT [FkConsumeItemProject] FOREIGN KEY ([IdProject]) REFERENCES [Project]([Id]);
ALTER TABLE [RaProjects].[dbo].[ConsumeItem] ADD CONSTRAINT [FkConsumeItemComponent] FOREIGN KEY ([IdComponent]) REFERENCES [Component]([Id]);
-- Row count: 2496

-- ----- RaProjects.CostGroup -----
CREATE TABLE [RaProjects].[dbo].[CostGroup] (
  [Id] int IDENTITY(1,1) NOT NULL,
  [Guid] uniqueidentifier NOT NULL,
  [CostGroupType] nvarchar(128),
  [LevelGuid] uniqueidentifier NOT NULL,
  [RowSignature] timestamp NOT NULL,
  [Designation] nvarchar(128) NOT NULL,
  [Description] nvarchar(255),
  CONSTRAINT [PK_CostGroup] PRIMARY KEY ([Id])
);
-- Row count: 50

-- ----- RaProjects.CostUsage -----
CREATE TABLE [RaProjects].[dbo].[CostUsage] (
  [Id] int IDENTITY(1,1) NOT NULL,
  [Guid] uniqueidentifier NOT NULL,
  [IdCostGroup] int NOT NULL,
  [CostType] nvarchar(128) NOT NULL,
  [RowSignature] timestamp NOT NULL,
  [Order] int NOT NULL,
  [Subtotal] bit NOT NULL,
  [Value] decimal(37,10) NOT NULL,
  [Level] int,
  [CostMode] nvarchar(128) NOT NULL,
  [DataGroup] nvarchar(128) NOT NULL,
  [Currency] nvarchar(128),
  [Designation] nvarchar(128) NOT NULL,
  CONSTRAINT [PK_CostUsage] PRIMARY KEY ([Id])
);
ALTER TABLE [RaProjects].[dbo].[CostUsage] ADD CONSTRAINT [FkCostGroupCostUsage] FOREIGN KEY ([IdCostGroup]) REFERENCES [CostGroup]([Id]);
-- Row count: 276

-- ----- RaProjects.Contact -----
CREATE TABLE [RaProjects].[dbo].[Contact] (
  [Id] int IDENTITY(1,1) NOT NULL,
  [Guid] uniqueidentifier NOT NULL,
  [Name] nvarchar(50) NOT NULL,
  [Address] nvarchar(255),
  [County] nvarchar(50),
  [Phone] nvarchar(50),
  [Fax] nvarchar(50),
  [Email] nvarchar(50),
  [IsActive] bit DEFAULT ((1)) NOT NULL,
  [IsCompany] bit NOT NULL,
  [IdContactCategory] int,
  [IdPersonal] int,
  [IdCompany] int,
  [RowSignature] timestamp NOT NULL,
  [CNP] nvarchar(20),
  [SerieId] nvarchar(20),
  [NumberId] nvarchar(20),
  [IssueDateId] datetime,
  [IssueAuthorityId] nvarchar(50),
  [CUI] nvarchar(20),
  [RegistrationNumber] nvarchar(20),
  [Bank] nvarchar(20),
  [IBAN] nvarchar(24),
  [ExtraInfo] nvarchar(50),
  [IdPersonalCompany] int,
  CONSTRAINT [PK_Contact] PRIMARY KEY ([Id])
);
-- Row count: 8

-- ----- RaProjects.ProjectPhase -----
CREATE TABLE [RaProjects].[dbo].[ProjectPhase] (
  [Id] int IDENTITY(1,1) NOT NULL,
  [Designation] nvarchar(128) NOT NULL,
  [Description] nvarchar(255),
  [ProjectType] nvarchar(128) NOT NULL,
  [RowSignature] timestamp NOT NULL,
  CONSTRAINT [PK_ProjectPhase] PRIMARY KEY ([Id])
);
-- Row count: 3

-- ----- RaProjects.FinancialValues -----
CREATE TABLE [RaProjects].[dbo].[FinancialValues] (
  [Id] int IDENTITY(1,1) NOT NULL,
  [ValueType] nvarchar(32),
  [CostMode] nvarchar(32),
  [Group] nvarchar(32) NOT NULL,
  [Value] decimal(18,10) NOT NULL,
  [GuidCostUsage] uniqueidentifier,
  [IdProject] int NOT NULL,
  [IdComponent] int,
  [IsProjectCost] bit
);
ALTER TABLE [RaProjects].[dbo].[FinancialValues] ADD CONSTRAINT [FK_FinancialValues_Project] FOREIGN KEY ([IdProject]) REFERENCES [Project]([Id]);
ALTER TABLE [RaProjects].[dbo].[FinancialValues] ADD CONSTRAINT [FK_FinancialValues_Component] FOREIGN KEY ([IdComponent]) REFERENCES [Component]([Id]);
-- Row count: 32

-- ----- RaProjects.Options -----
CREATE TABLE [RaProjects].[dbo].[Options] (
  [Id] int IDENTITY(1,1) NOT NULL,
  [IdProject] int NOT NULL,
  [OptimizationOptions] varbinary(MAX),
  [RowSignature] timestamp NOT NULL,
  [StockCheckSumInitial] int,
  [StockCheckSumFinal] int,
  [OptimizationLossUsageMode] nvarchar(128) NOT NULL,
  CONSTRAINT [PK_Options] PRIMARY KEY ([Id])
);
ALTER TABLE [RaProjects].[dbo].[Options] ADD CONSTRAINT [FkOptionsProject] FOREIGN KEY ([IdProject]) REFERENCES [Project]([Id]);
-- Row count: 8

-- ----- RaProjects.Segment -----
CREATE TABLE [RaProjects].[dbo].[Segment] (
  [Id] int IDENTITY(1,1) NOT NULL,
  [IdCuttingPattern] int NOT NULL,
  [Order] int NOT NULL,
  [IdConsumeItem] int NOT NULL,
  [Bin] int,
  [Cell] int,
  [IdShadowSegment] int,
  [RowSignature] timestamp NOT NULL,
  CONSTRAINT [PK_Segment] PRIMARY KEY ([Id])
);
ALTER TABLE [RaProjects].[dbo].[Segment] ADD CONSTRAINT [FK_Segment_CuttingPattern] FOREIGN KEY ([IdCuttingPattern]) REFERENCES [CuttingPattern]([Id]);
ALTER TABLE [RaProjects].[dbo].[Segment] ADD CONSTRAINT [FkSegmentConsumeItem] FOREIGN KEY ([IdConsumeItem]) REFERENCES [ConsumeItem]([Id]);
ALTER TABLE [RaProjects].[dbo].[Segment] ADD CONSTRAINT [FkSegmentShadowSegment] FOREIGN KEY ([IdShadowSegment]) REFERENCES [Segment]([Id]);
-- Row count: 0
